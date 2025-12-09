import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
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
          offer: true,
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
    },
    orderBy: (tx, { desc }) => [desc(tx.transactionDate)],
  });

  return transactions;
}
