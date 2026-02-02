/**
 * Seed transactions with realistic spending patterns
 *
 * Generates transactions over the last 90 days with varied counts
 * to produce a confidence level distribution for Spend Stim simulations:
 * - 80% HIGH confidence (25-55 transactions)
 * - 15% MEDIUM confidence (10-17 transactions)
 * - 5% LOW confidence (2-6 transactions)
 */

import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { AccountTier } from "../schema";
import {
  generateTransactionDate,
  generateTransactionAmount,
  getTierMultiplier,
  getMerchantsForAccount,
  GENERAL_MERCHANTS,
  type MerchantConfig,
  type SpendingGroupAssignment,
  type SpendingProfile,
} from "./generators";
import { buildAccountToCardsMap, selectCardForTransaction } from "./utils";

// Re-seed faker for transaction generation
faker.seed(54321);

interface Account {
  id: string;
  tier: AccountTier;
  spendingProfile: SpendingProfile;
}

interface Enrollment {
  id: string;
  accountId: string;
  offerId: string;
  status: string;
}

interface Offer {
  id: string;
  name: string;
  vendor: string | null;
  parameters: Record<string, unknown> | null;
}

interface AccountCreditCardLink {
  accountId: string;
  creditCardId: string;
  isPrimary: boolean;
  preferredForCategory: string | null;
}

interface SeedTransactionsDeps {
  accounts: Account[];
  enrollments: Enrollment[];
  offers: Offer[];
  accountCreditCardsData: AccountCreditCardLink[];
  groupAssignments: Map<string, SpendingGroupAssignment[]>;
}

type ConfidenceTier = "HIGH" | "MEDIUM" | "LOW";

/**
 * Deterministically assign confidence tier based on account position
 * Distribution: 80% HIGH, 15% MEDIUM, 5% LOW
 */
function getConfidenceTierForAccount(
  accountIndex: number,
  totalAccounts: number
): ConfidenceTier {
  const position = accountIndex / totalAccounts;
  if (position < 0.8) return "HIGH";
  if (position < 0.95) return "MEDIUM";
  return "LOW";
}

/**
 * Seed account transactions with offer qualification metadata
 * Transaction counts vary by confidence tier (80% HIGH, 15% MEDIUM, 5% LOW)
 */
export async function seedTransactions(deps: SeedTransactionsDeps) {
  const { accounts, enrollments, offers, accountCreditCardsData, groupAssignments } =
    deps;

  console.log("Creating account transactions...");

  // Build account to cards mapping for smart card selection
  const accountToCards = buildAccountToCardsMap(accountCreditCardsData);

  // Build enrollment lookup map: accountId -> enrollment details
  const enrollmentMap = new Map<
    string,
    { enrollmentId: string; offerId: string; vendor: string | null; category: string }
  >();

  for (const enrollment of enrollments) {
    if (enrollment.status === "IN_PROGRESS" || enrollment.status === "COMPLETED") {
      const offer = offers.find((o) => o.id === enrollment.offerId);
      if (offer) {
        const category =
          (offer.parameters?.category as string) ||
          (offer.vendor ? "Vendor-specific" : "General");
        enrollmentMap.set(`${enrollment.accountId}-${enrollment.offerId}`, {
          enrollmentId: enrollment.id,
          offerId: enrollment.offerId,
          vendor: offer.vendor,
          category,
        });
      }
    }
  }

  // Build account enrollment lookup
  const accountEnrollments = new Map<
    string,
    Array<{ enrollmentId: string; vendor: string | null; category: string; offerName: string }>
  >();

  for (const enrollment of enrollments) {
    if (enrollment.status === "IN_PROGRESS" || enrollment.status === "COMPLETED") {
      const offer = offers.find((o) => o.id === enrollment.offerId);
      if (offer) {
        const category =
          (offer.parameters?.category as string) ||
          (offer.vendor ? "Vendor-specific" : "General");
        const existing = accountEnrollments.get(enrollment.accountId) || [];
        existing.push({
          enrollmentId: enrollment.id,
          vendor: offer.vendor,
          category,
          offerName: offer.name,
        });
        accountEnrollments.set(enrollment.accountId, existing);
      }
    }
  }

  const allTransactions: Array<{
    accountId: string;
    enrollmentId: string | null;
    creditCardId: string;
    transactionDate: Date;
    merchant: string;
    category: string;
    amount: number;
    qualifiesForOffer: boolean;
    metadata: Record<string, unknown>;
  }> = [];

  // Generate transactions for each account
  for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
    const account = accounts[accountIndex];

    // Determine confidence tier for this account (80% HIGH, 15% MEDIUM, 5% LOW)
    const confidenceTier = getConfidenceTierForAccount(accountIndex, accounts.length);

    // Generate transaction count based on confidence tier
    let transactionCount: number;
    if (confidenceTier === "HIGH") {
      // 20+ transactions for HIGH confidence
      const baseCount = faker.number.int({ min: 25, max: 45 });
      const tierBonus =
        account.tier === "DIAMOND"
          ? 10
          : account.tier === "PLATINUM"
          ? 5
          : account.tier === "GOLD"
          ? 2
          : 0;
      transactionCount = baseCount + tierBonus;
    } else if (confidenceTier === "MEDIUM") {
      // 8-19 transactions for MEDIUM confidence
      transactionCount = faker.number.int({ min: 10, max: 17 });
    } else {
      // 0-7 transactions for LOW confidence
      transactionCount = faker.number.int({ min: 2, max: 6 });
    }

    // Get merchants based on spending group membership
    const groupMerchants = getMerchantsForAccount(account.id, groupAssignments);
    const tierMultiplier = getTierMultiplier(account.tier);

    // Get enrollments for this account
    const accountEnrollmentList = accountEnrollments.get(account.id) || [];

    // 70% group-aligned transactions, 30% general
    const groupTransactionCount = Math.round(transactionCount * 0.7);
    const generalTransactionCount = transactionCount - groupTransactionCount;

    // Generate group-aligned transactions
    for (let i = 0; i < groupTransactionCount; i++) {
      const merchant =
        groupMerchants.length > 0
          ? faker.helpers.arrayElement(groupMerchants)
          : faker.helpers.arrayElement(GENERAL_MERCHANTS);

      const transaction = generateTransaction(
        account,
        merchant,
        tierMultiplier,
        accountEnrollmentList,
        accountToCards
      );
      allTransactions.push(transaction);
    }

    // Generate general transactions
    for (let i = 0; i < generalTransactionCount; i++) {
      const merchant = faker.helpers.arrayElement(GENERAL_MERCHANTS);
      const transaction = generateTransaction(
        account,
        merchant,
        tierMultiplier,
        accountEnrollmentList,
        accountToCards
      );
      allTransactions.push(transaction);
    }
  }

  // Sort all transactions by date descending
  allTransactions.sort(
    (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()
  );

  // Insert in batches to avoid overwhelming the database
  const batchSize = 500;
  for (let i = 0; i < allTransactions.length; i += batchSize) {
    const batch = allTransactions.slice(i, i + batchSize);
    await db.insert(schema.accountTransactions).values(batch);
  }

  // Calculate statistics
  const qualifyingCount = allTransactions.filter((t) => t.qualifiesForOffer).length;
  const avgPerAccount = Math.round(allTransactions.length / accounts.length);

  console.log(`✓ Created ${allTransactions.length} transactions`);
  console.log(
    `  Average per account: ${avgPerAccount}, Qualifying for offers: ${qualifyingCount}`
  );

  return allTransactions;
}

/**
 * Generate a single transaction with proper qualification logic
 */
function generateTransaction(
  account: Account,
  merchant: MerchantConfig,
  tierMultiplier: number,
  accountEnrollments: Array<{
    enrollmentId: string;
    vendor: string | null;
    category: string;
    offerName: string;
  }>,
  accountToCards: Map<string, Array<{ cardId: string; isPrimary: boolean; preferredCategory: string | null }>>
): {
  accountId: string;
  enrollmentId: string | null;
  creditCardId: string;
  transactionDate: Date;
  merchant: string;
  category: string;
  amount: number;
  qualifiesForOffer: boolean;
  metadata: Record<string, unknown>;
} {
  const amount = generateTransactionAmount(merchant, tierMultiplier);
  const date = generateTransactionDate(90);
  const creditCardId = selectCardForTransaction(
    account.id,
    merchant.category,
    accountToCards
  );

  // Check if this transaction qualifies for any enrollment
  let qualifiesForOffer = false;
  let enrollmentId: string | null = null;
  let qualificationMetadata: Record<string, unknown> = {};

  for (const enrollment of accountEnrollments) {
    const matchesVendor =
      enrollment.vendor && merchant.name.includes(enrollment.vendor);
    const matchesCategory =
      enrollment.category === merchant.category ||
      (enrollment.category === "Online Shopping" &&
        merchant.category === "Online Shopping") ||
      (enrollment.category === "Travel" && merchant.category === "Travel") ||
      (enrollment.category === "Dining" && merchant.category === "Dining") ||
      (enrollment.category === "Groceries" && merchant.category === "Groceries");

    if (matchesVendor || matchesCategory) {
      qualifiesForOffer = true;
      enrollmentId = enrollment.enrollmentId;
      qualificationMetadata = {
        qualification: {
          qualified: true,
          offerName: enrollment.offerName,
          reason: matchesVendor
            ? `Transaction at ${merchant.name} qualifies for ${enrollment.offerName}`
            : `Transaction in ${merchant.category} category qualifies for ${enrollment.offerName}`,
          details: {
            merchantMatch: !!matchesVendor,
            categoryMatch: matchesCategory,
            vendor: enrollment.vendor,
            category: enrollment.category,
          },
        },
      };
      break;
    }
  }

  if (!qualifiesForOffer) {
    qualificationMetadata = {
      qualification: {
        qualified: false,
        reason: `No active offer enrollment for ${merchant.category} category`,
        details: {
          merchantMatch: false,
          categoryMatch: false,
          suggestion: getSuggestionForCategory(merchant.category),
        },
      },
    };
  }

  return {
    accountId: account.id,
    enrollmentId,
    creditCardId,
    transactionDate: date,
    merchant: merchant.name,
    category: merchant.category,
    amount,
    qualifiesForOffer,
    metadata: qualificationMetadata,
  };
}

/**
 * Get suggestion for unenrolled category
 */
function getSuggestionForCategory(category: string): string {
  const suggestions: Record<string, string> = {
    "Online Shopping": "Enroll in Amazon 3× Points for bonus rewards",
    Travel: "Enroll in Travel Miles Accelerator for 5× points",
    Dining: "Enroll in Starbucks Bonus for 500 bonus points",
    Groceries: "Enroll in Recurring Groceries Booster for 2× points",
    "Gas Stations": "Enroll in Gas Station Rewards for 3× points",
    Retail: "Enroll in Target 5% Weekend for cashback",
    Electronics: "No current offers available for Electronics",
    "Food Delivery": "Enroll in Dining Cashback for 3% cashback",
    Pharmacy: "No current offers available for Pharmacy",
    Entertainment: "No current offers available for Entertainment",
    Utilities: "No current offers available for Utilities",
    "Home Improvement": "No current offers available for Home Improvement",
  };

  return suggestions[category] || "Check available offers for this category";
}
