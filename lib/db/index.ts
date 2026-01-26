import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Helper functions for common queries
export async function getCampaignWithRelations(campaignId: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
    with: {
      campaignOffers: {
        with: {
          offer: {
            with: {
              disclosures: true,
            },
          },
        },
      },
      campaignSegments: {
        with: {
          segment: true,
        },
      },
      campaignEligibilityRules: {
        with: {
          eligibilityRule: true,
        },
      },
      approvals: true,
      channelPlan: true,
      fulfillmentPlan: true,
      controlChecklist: true,
      simulationRuns: {
        orderBy: (runs, { desc }) => [desc(runs.createdAt)],
        limit: 1,
      },
      campaignDisclosures: {
        orderBy: (d, { desc }) => [desc(d.generatedAt)],
        limit: 1,
      },
    },
  });

  return campaign;
}

export async function getOfferWithCampaigns(offerId: string) {
  const offer = await db.query.offers.findFirst({
    where: (offers, { eq }) => eq(offers.id, offerId),
    with: {
      campaignOffers: {
        with: {
          campaign: true,
        },
      },
      disclosures: true,
    },
  });

  return offer;
}

export interface OfferFilters {
  type?: schema.OfferType;
  vendor?: string;
  search?: string;
}

export async function getAllOffers(filters?: OfferFilters) {
  const allOffers = await db.query.offers.findMany({
    with: {
      campaignOffers: {
        with: {
          campaign: true,
        },
      },
      disclosures: true,
    },
    orderBy: (offers, { desc }) => [desc(offers.createdAt)],
  });

  // Apply filters in-memory (for simplicity in POC)
  let filtered = allOffers;

  if (filters?.type) {
    filtered = filtered.filter((o) => o.type === filters.type);
  }

  if (filters?.vendor) {
    filtered = filtered.filter(
      (o) => o.vendor?.toLowerCase() === filters.vendor?.toLowerCase()
    );
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (o) =>
        o.name.toLowerCase().includes(search) ||
        o.vendor?.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export async function updateOffer(
  offerId: string,
  data: Partial<typeof schema.offers.$inferInsert>
) {
  const [updatedOffer] = await db
    .update(schema.offers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.offers.id, offerId))
    .returning();

  return updatedOffer;
}

export async function getCampaignsByStatus(status: schema.CampaignStatus) {
  const campaigns = await db.query.campaigns.findMany({
    where: (campaigns, { eq }) => eq(campaigns.status, status),
    with: {
      campaignOffers: {
        with: {
          offer: true,
        },
      },
    },
    orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)],
  });

  return campaigns;
}

export async function getAllCampaignsGrouped() {
  const allCampaigns = await db.query.campaigns.findMany({
    with: {
      campaignOffers: {
        with: {
          offer: true,
        },
      },
    },
    orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)],
  });

  const grouped = {
    LIVE: allCampaigns.filter((c) => c.status === "LIVE"),
    IN_REVIEW: allCampaigns.filter((c) => c.status === "IN_REVIEW"),
    ENDED: allCampaigns.filter((c) => c.status === "ENDED"),
    DRAFT: allCampaigns.filter((c) => c.status === "DRAFT"),
    TESTING: allCampaigns.filter((c) => c.status === "TESTING"),
  };

  return grouped;
}

export async function getSimulationRun(runId: string) {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
    with: {
      campaign: true,
    },
  });

  return run;
}

// ==========================================
// ACCOUNT HELPERS
// ==========================================

export interface AccountFilters {
  tier?: schema.AccountTier;
  status?: schema.AccountStatus;
  search?: string;
}

export async function getAllAccounts(filters?: AccountFilters) {
  const allAccounts = await db.query.accounts.findMany({
    with: {
      accountOfferEnrollments: true,
      spendingGroupAccounts: {
        with: {
          spendingGroup: true,
        },
      },
    },
    orderBy: (accounts, { desc }) => [desc(accounts.updatedAt)],
  });

  // Apply filters in-memory (for simplicity in POC)
  let filtered = allAccounts;

  if (filters?.tier) {
    filtered = filtered.filter((a) => a.tier === filters.tier);
  }

  if (filters?.status) {
    filtered = filtered.filter((a) => a.status === filters.status);
  }

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.firstName.toLowerCase().includes(search) ||
        a.lastName.toLowerCase().includes(search) ||
        a.accountNumber.toLowerCase().includes(search) ||
        a.email.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export async function getAccountWithDetails(accountId: string) {
  const account = await db.query.accounts.findFirst({
    where: (accounts, { eq }) => eq(accounts.id, accountId),
    with: {
      accountOfferEnrollments: {
        with: {
          offer: true,
          campaign: true,
          transactions: {
            orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
          },
        },
        orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
      },
      accountTransactions: {
        with: {
          creditCard: true,
          enrollment: {
            with: {
              offer: true,
              campaign: true,
            },
          },
        },
        orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
        limit: 100,
      },
      accountCreditCards: {
        with: {
          creditCard: true,
        },
      },
      spendingGroupAccounts: {
        with: {
          spendingGroup: true,
        },
      },
    },
  });

  return account;
}

// ==========================================
// SPENDING GROUP HELPERS
// ==========================================

export async function getAllSpendingGroups() {
  const groups = await db.query.spendingGroups.findMany({
    with: {
      spendingGroupAccounts: {
        with: {
          account: true,
        },
      },
      segmentSpendingGroups: {
        with: {
          segment: true,
        },
      },
    },
    orderBy: (groups, { desc }) => [desc(groups.accountCount)],
  });

  return groups;
}

export async function getSpendingGroupWithAccounts(groupId: string) {
  const group = await db.query.spendingGroups.findFirst({
    where: (groups, { eq }) => eq(groups.id, groupId),
    with: {
      spendingGroupAccounts: {
        with: {
          account: {
            with: {
              accountOfferEnrollments: true,
            },
          },
        },
      },
      segmentSpendingGroups: {
        with: {
          segment: true,
        },
      },
    },
  });

  return group;
}

// ==========================================
// ENROLLMENT HELPERS
// ==========================================

export async function getEnrollmentsByCampaign(campaignId: string) {
  const enrollments = await db.query.accountOfferEnrollments.findMany({
    where: (enrollments, { eq }) => eq(enrollments.campaignId, campaignId),
    with: {
      account: true,
      offer: true,
      transactions: {
        orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
        limit: 10,
      },
    },
    orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
  });

  return enrollments;
}

export async function getEnrollmentsByOffer(offerId: string) {
  const enrollments = await db.query.accountOfferEnrollments.findMany({
    where: (enrollments, { eq }) => eq(enrollments.offerId, offerId),
    with: {
      account: true,
      campaign: true,
    },
    orderBy: (enrollments, { desc }) => [desc(enrollments.enrolledAt)],
  });

  return enrollments;
}

export async function getEnrollmentWithTransactions(enrollmentId: string) {
  const enrollment = await db.query.accountOfferEnrollments.findFirst({
    where: (enrollments, { eq }) => eq(enrollments.id, enrollmentId),
    with: {
      account: true,
      offer: true,
      campaign: true,
      transactions: {
        orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
      },
    },
  });

  return enrollment;
}

// ==========================================
// TRANSACTION HELPERS
// ==========================================

export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
}

export async function getAccountTransactions(
  accountId: string,
  filters?: TransactionFilters
) {
  const transactions = await db.query.accountTransactions.findMany({
    where: (tx, { eq, and, gte, lte }) => {
      const conditions = [eq(tx.accountId, accountId)];
      if (filters?.startDate) {
        conditions.push(gte(tx.transactionDate, filters.startDate));
      }
      if (filters?.endDate) {
        conditions.push(lte(tx.transactionDate, filters.endDate));
      }
      return and(...conditions);
    },
    with: {
      creditCard: true,
      enrollment: {
        with: {
          offer: true,
          campaign: true,
        },
      },
    },
    orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
  });

  return transactions;
}

// ==========================================
// SPEND STIM SIMULATION HELPERS
// ==========================================

/**
 * Get spending groups linked to a campaign via segments
 * Used by Spend Stim simulation to find all accounts to analyze
 */
export async function getCampaignSpendingGroups(campaignId: string) {
  // Step 1: Get campaign with its segments
  const campaign = await db.query.campaigns.findFirst({
    where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
    with: {
      campaignSegments: {
        with: {
          segment: true,
        },
      },
    },
  });

  if (!campaign || campaign.campaignSegments.length === 0) {
    return [];
  }

  // Step 2: Get segment IDs
  const segmentIds = campaign.campaignSegments.map((cs) => cs.segment.id);

  // Step 3: Get spending group IDs linked to these segments
  const segmentSpendingGroups = await db.query.segmentSpendingGroups.findMany({
    where: (ssg, { inArray }) => inArray(ssg.segmentId, segmentIds),
  });

  if (segmentSpendingGroups.length === 0) {
    return [];
  }

  const spendingGroupIds = [
    ...new Set(segmentSpendingGroups.map((ssg) => ssg.spendingGroupId)),
  ];

  // Step 4: Get spending groups with their accounts
  const spendingGroups = await db.query.spendingGroups.findMany({
    where: (sg, { inArray }) => inArray(sg.id, spendingGroupIds),
    with: {
      spendingGroupAccounts: {
        with: {
          account: true,
        },
      },
    },
  });

  // Step 5: Transform to expected format
  return spendingGroups.map((sg) => ({
    id: sg.id,
    name: sg.name,
    description: sg.description,
    accounts: sg.spendingGroupAccounts.map((sga) => ({
      id: sga.account.id,
      firstName: sga.account.firstName,
      lastName: sga.account.lastName,
      tier: sga.account.tier,
      annualSpend: sga.account.annualSpend,
      accountNumber: sga.account.accountNumber,
    })),
  }));
}

/**
 * Get accounts with their transaction history for a spending group
 * Used by Spend Stim simulation to analyze historical spending patterns
 */
export async function getSpendingGroupAccountsWithTransactions(
  spendingGroupId: string,
  sinceDate?: Date
) {
  const group = await db.query.spendingGroups.findFirst({
    where: (groups, { eq }) => eq(groups.id, spendingGroupId),
    with: {
      spendingGroupAccounts: {
        with: {
          account: {
            with: {
              accountTransactions: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    return [];
  }

  // Filter transactions by date if provided and return account with transactions
  return group.spendingGroupAccounts.map((sga) => ({
    id: sga.account.id,
    firstName: sga.account.firstName,
    lastName: sga.account.lastName,
    tier: sga.account.tier,
    annualSpend: sga.account.annualSpend,
    accountNumber: sga.account.accountNumber,
    transactions: sinceDate
      ? sga.account.accountTransactions.filter(
          (tx) => new Date(tx.transactionDate) >= sinceDate
        )
      : sga.account.accountTransactions,
  }));
}

/**
 * Get all accounts with their transaction history for multiple spending groups
 * Used by Spend Stim simulation for campaigns targeting multiple spending groups
 */
export async function getAccountsWithTransactionsForCampaign(
  campaignId: string,
  sinceDate?: Date
) {
  const spendingGroups = await getCampaignSpendingGroups(campaignId);

  if (spendingGroups.length === 0) {
    return { spendingGroups: [], accounts: [] };
  }

  // Collect all unique account IDs from spending groups
  const accountIdsSet = new Set<string>();
  for (const sg of spendingGroups) {
    for (const account of sg.accounts) {
      accountIdsSet.add(account.id);
    }
  }

  const accountIds = Array.from(accountIdsSet);

  // Fetch all accounts with their transactions
  const accounts = await db.query.accounts.findMany({
    where: (accounts, { inArray }) => inArray(accounts.id, accountIds),
    with: {
      accountTransactions: {
        orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
      },
    },
  });

  // Filter transactions by date if provided
  const accountsWithFilteredTransactions = accounts.map((account) => ({
    ...account,
    transactions: sinceDate
      ? account.accountTransactions.filter(
          (tx) => new Date(tx.transactionDate) >= sinceDate
        )
      : account.accountTransactions,
  }));

  return {
    spendingGroups,
    accounts: accountsWithFilteredTransactions,
  };
}

// ==========================================
// DISCLOSURE HELPERS
// ==========================================

export async function getOfferDisclosures(offerId: string) {
  return db.query.offerDisclosures.findMany({
    where: (d, { eq }) => eq(d.offerId, offerId),
    orderBy: (d, { desc }) => [desc(d.createdAt)],
  });
}

export async function getCampaignDisclosure(campaignId: string) {
  return db.query.campaignDisclosures.findFirst({
    where: (d, { eq }) => eq(d.campaignId, campaignId),
    orderBy: (d, { desc }) => [desc(d.generatedAt)],
  });
}

export async function getDisclosuresForCampaignOffers(campaignId: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: (c, { eq }) => eq(c.id, campaignId),
    with: {
      campaignOffers: {
        with: {
          offer: {
            with: {
              disclosures: true,
            },
          },
        },
      },
    },
  });

  if (!campaign) return [];

  return campaign.campaignOffers
    .map((co) => ({
      offer: co.offer,
      disclosures: co.offer.disclosures,
    }))
    .filter((item) => item.disclosures.length > 0);
}
