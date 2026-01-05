/**
 * Faker-based generators for seed data
 * Provides utilities for generating realistic account, transaction, and merchant data
 */

import { faker } from "@faker-js/faker";
import type { AccountTier } from "../schema";

// Set a seed for reproducible data generation
faker.seed(12345);

// ============================================
// TIER CONFIGURATION
// ============================================

export interface TierConfig {
  tier: AccountTier;
  count: number;
  creditLimitRange: [number, number];
  annualSpendRange: [number, number];
  avgTransactionRange: [number, number];
  memberSinceYearsRange: [number, number];
}

export const TIER_CONFIGS: TierConfig[] = [
  {
    tier: "DIAMOND",
    count: 15,
    creditLimitRange: [3500000, 5000000], // $35K-$50K
    annualSpendRange: [8000000, 20000000], // $80K-$200K
    avgTransactionRange: [15000, 50000], // $150-$500
    memberSinceYearsRange: [5, 10],
  },
  {
    tier: "PLATINUM",
    count: 35,
    creditLimitRange: [1500000, 3500000], // $15K-$35K
    annualSpendRange: [4000000, 8000000], // $40K-$80K
    avgTransactionRange: [8000, 25000], // $80-$250
    memberSinceYearsRange: [3, 7],
  },
  {
    tier: "GOLD",
    count: 60,
    creditLimitRange: [700000, 1500000], // $7K-$15K
    annualSpendRange: [1500000, 4000000], // $15K-$40K
    avgTransactionRange: [4000, 15000], // $40-$150
    memberSinceYearsRange: [1, 5],
  },
  {
    tier: "STANDARD",
    count: 90,
    creditLimitRange: [300000, 700000], // $3K-$7K
    annualSpendRange: [300000, 1500000], // $3K-$15K
    avgTransactionRange: [2000, 8000], // $20-$80
    memberSinceYearsRange: [0, 3],
  },
];

// ============================================
// SPENDING GROUP CATEGORIES
// ============================================

export interface SpendingGroupConfig {
  name: string;
  description: string;
  categories: string[];
  merchants: MerchantConfig[];
  targetTiers: AccountTier[];
  targetAccountCount: number;
  minAnnualSpend?: number;
}

export interface MerchantConfig {
  name: string;
  category: string;
  amountRange: [number, number]; // in cents
}

export const SPENDING_GROUP_CONFIGS: SpendingGroupConfig[] = [
  {
    name: "Premium Travelers",
    description:
      "High travel spend customers, primarily PLATINUM/DIAMOND tier members who travel frequently",
    categories: ["Travel", "Airlines", "Hotels"],
    merchants: [
      {
        name: "Delta Airlines",
        category: "Travel",
        amountRange: [25000, 80000],
      },
      {
        name: "United Airlines",
        category: "Travel",
        amountRange: [30000, 90000],
      },
      {
        name: "American Airlines",
        category: "Travel",
        amountRange: [28000, 85000],
      },
      {
        name: "Southwest Airlines",
        category: "Travel",
        amountRange: [15000, 45000],
      },
      {
        name: "JetBlue Airways",
        category: "Travel",
        amountRange: [12000, 40000],
      },
      {
        name: "Marriott Hotels",
        category: "Travel",
        amountRange: [20000, 60000],
      },
      { name: "Hilton", category: "Travel", amountRange: [18000, 55000] },
      { name: "Hyatt Hotels", category: "Travel", amountRange: [22000, 65000] },
      {
        name: "Four Seasons",
        category: "Travel",
        amountRange: [35000, 120000],
      },
      { name: "Airbnb", category: "Travel", amountRange: [15000, 50000] },
      { name: "Expedia", category: "Travel", amountRange: [20000, 70000] },
      { name: "Booking.com", category: "Travel", amountRange: [18000, 55000] },
    ],
    targetTiers: ["DIAMOND", "PLATINUM"],
    targetAccountCount: 40,
    minAnnualSpend: 4000000,
  },
  {
    name: "Everyday Essentials",
    description: "Customers focused on groceries and gas station spending",
    categories: ["Groceries", "Gas Stations"],
    merchants: [
      {
        name: "Whole Foods",
        category: "Groceries",
        amountRange: [8000, 25000],
      },
      {
        name: "Trader Joe's",
        category: "Groceries",
        amountRange: [5000, 18000],
      },
      { name: "Costco", category: "Groceries", amountRange: [15000, 40000] },
      { name: "Safeway", category: "Groceries", amountRange: [6000, 20000] },
      { name: "Kroger", category: "Groceries", amountRange: [5000, 18000] },
      {
        name: "Walmart Grocery",
        category: "Groceries",
        amountRange: [7000, 22000],
      },
      {
        name: "Target Grocery",
        category: "Groceries",
        amountRange: [5000, 15000],
      },
      { name: "Aldi", category: "Groceries", amountRange: [4000, 12000] },
      {
        name: "Shell Gas",
        category: "Gas Stations",
        amountRange: [4000, 8000],
      },
      { name: "Chevron", category: "Gas Stations", amountRange: [4500, 8500] },
      {
        name: "ExxonMobil",
        category: "Gas Stations",
        amountRange: [4000, 7500],
      },
      { name: "BP", category: "Gas Stations", amountRange: [3500, 7000] },
      {
        name: "Costco Gas",
        category: "Gas Stations",
        amountRange: [5000, 9000],
      },
    ],
    targetTiers: ["DIAMOND", "PLATINUM", "GOLD", "STANDARD"],
    targetAccountCount: 60,
    minAnnualSpend: 500000,
  },
  {
    name: "Online Shoppers",
    description: "Heavy Amazon and online retail users",
    categories: ["Online Shopping"],
    merchants: [
      {
        name: "Amazon",
        category: "Online Shopping",
        amountRange: [3000, 35000],
      },
      {
        name: "Amazon Prime",
        category: "Online Shopping",
        amountRange: [1500, 5000],
      },
      { name: "eBay", category: "Online Shopping", amountRange: [2500, 20000] },
      { name: "Etsy", category: "Online Shopping", amountRange: [3000, 15000] },
      {
        name: "Wayfair",
        category: "Online Shopping",
        amountRange: [10000, 50000],
      },
      {
        name: "Best Buy Online",
        category: "Online Shopping",
        amountRange: [8000, 60000],
      },
      {
        name: "Walmart.com",
        category: "Online Shopping",
        amountRange: [4000, 25000],
      },
      {
        name: "Target.com",
        category: "Online Shopping",
        amountRange: [3500, 20000],
      },
      {
        name: "Zappos",
        category: "Online Shopping",
        amountRange: [5000, 18000],
      },
      {
        name: "Chewy",
        category: "Online Shopping",
        amountRange: [4000, 15000],
      },
    ],
    targetTiers: ["DIAMOND", "PLATINUM", "GOLD", "STANDARD"],
    targetAccountCount: 50,
  },
  {
    name: "Dining Enthusiasts",
    description: "Restaurant and dining focused spenders",
    categories: ["Dining", "Restaurants", "Food Delivery"],
    merchants: [
      { name: "Starbucks", category: "Dining", amountRange: [500, 2500] },
      { name: "Chipotle", category: "Dining", amountRange: [1200, 3500] },
      { name: "Panera Bread", category: "Dining", amountRange: [1000, 3000] },
      {
        name: "Cheesecake Factory",
        category: "Dining",
        amountRange: [4000, 12000],
      },
      { name: "Olive Garden", category: "Dining", amountRange: [3500, 10000] },
      { name: "Red Lobster", category: "Dining", amountRange: [4000, 11000] },
      {
        name: "Outback Steakhouse",
        category: "Dining",
        amountRange: [4500, 12000],
      },
      { name: "Ruth's Chris", category: "Dining", amountRange: [15000, 40000] },
      {
        name: "DoorDash",
        category: "Food Delivery",
        amountRange: [2500, 6000],
      },
      {
        name: "Uber Eats",
        category: "Food Delivery",
        amountRange: [2000, 5500],
      },
      { name: "Grubhub", category: "Food Delivery", amountRange: [2200, 5000] },
      {
        name: "Local Restaurant",
        category: "Dining",
        amountRange: [3000, 10000],
      },
    ],
    targetTiers: ["DIAMOND", "PLATINUM", "GOLD", "STANDARD"],
    targetAccountCount: 45,
    minAnnualSpend: 300000,
  },
  {
    name: "High Value Customers",
    description: "Top 10% overall spend - most valuable customers",
    categories: ["Travel", "Online Shopping", "Dining", "Retail"],
    merchants: [
      // Mix of high-value merchants from all categories
      { name: "Nordstrom", category: "Retail", amountRange: [15000, 50000] },
      {
        name: "Neiman Marcus",
        category: "Retail",
        amountRange: [20000, 80000],
      },
      {
        name: "Saks Fifth Avenue",
        category: "Retail",
        amountRange: [18000, 70000],
      },
      {
        name: "Apple Store",
        category: "Electronics",
        amountRange: [50000, 200000],
      },
      { name: "Tesla", category: "Auto", amountRange: [100000, 500000] },
      {
        name: "Louis Vuitton",
        category: "Retail",
        amountRange: [30000, 150000],
      },
      {
        name: "Tiffany & Co",
        category: "Retail",
        amountRange: [25000, 100000],
      },
      {
        name: "Delta Airlines",
        category: "Travel",
        amountRange: [30000, 100000],
      },
      {
        name: "Four Seasons",
        category: "Travel",
        amountRange: [40000, 150000],
      },
    ],
    targetTiers: ["DIAMOND", "PLATINUM"],
    targetAccountCount: 25,
    minAnnualSpend: 7500000,
  },
];

// ============================================
// GENERAL MERCHANTS (for non-group spending)
// ============================================

export const GENERAL_MERCHANTS: MerchantConfig[] = [
  // Retail
  { name: "Target", category: "Retail", amountRange: [3000, 15000] },
  { name: "Walmart", category: "Retail", amountRange: [4000, 18000] },
  { name: "Costco", category: "Retail", amountRange: [10000, 35000] },
  {
    name: "Home Depot",
    category: "Home Improvement",
    amountRange: [5000, 30000],
  },
  { name: "Lowe's", category: "Home Improvement", amountRange: [4500, 28000] },
  // Pharmacy
  { name: "CVS", category: "Pharmacy", amountRange: [1500, 8000] },
  { name: "Walgreens", category: "Pharmacy", amountRange: [1200, 7000] },
  // Entertainment
  { name: "Netflix", category: "Entertainment", amountRange: [1500, 2500] },
  { name: "Spotify", category: "Entertainment", amountRange: [1000, 1500] },
  {
    name: "AMC Theatres",
    category: "Entertainment",
    amountRange: [2500, 6000],
  },
  // Utilities
  { name: "AT&T", category: "Utilities", amountRange: [8000, 15000] },
  { name: "Verizon", category: "Utilities", amountRange: [8500, 16000] },
  {
    name: "Electric Company",
    category: "Utilities",
    amountRange: [10000, 25000],
  },
];

// ============================================
// DATE GENERATORS
// ============================================

/**
 * Generate a random date within the last N days
 * Weighted towards weekends for realistic shopping patterns
 */
export function generateTransactionDate(daysBack: number = 90): Date {
  const now = new Date();
  const daysAgo = faker.number.int({ min: 1, max: daysBack });
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);

  // 30% chance to shift to weekend if not already
  const dayOfWeek = date.getDay();
  if (dayOfWeek !== 0 && dayOfWeek !== 6 && faker.number.float() < 0.3) {
    // Shift to Saturday or Sunday
    const shift = dayOfWeek === 5 ? 1 : 6 - dayOfWeek;
    date.setDate(date.getDate() + shift);
  }

  return date;
}

/**
 * Generate a member since date based on tier
 */
export function generateMemberSinceDate(yearsRange: [number, number]): Date {
  const yearsAgo = faker.number.float({
    min: yearsRange[0],
    max: yearsRange[1],
    fractionDigits: 2,
  });
  const date = new Date();
  date.setFullYear(date.getFullYear() - Math.floor(yearsAgo));
  date.setMonth(faker.number.int({ min: 0, max: 11 }));
  date.setDate(faker.number.int({ min: 1, max: 28 }));
  return date;
}

// ============================================
// AMOUNT GENERATORS
// ============================================

/**
 * Generate a transaction amount based on tier and merchant config
 */
export function generateTransactionAmount(
  merchant: MerchantConfig,
  tierMultiplier: number = 1
): number {
  const baseAmount = faker.number.int({
    min: merchant.amountRange[0],
    max: merchant.amountRange[1],
  });
  return Math.round(baseAmount * tierMultiplier);
}

/**
 * Get tier multiplier for transaction amounts
 */
export function getTierMultiplier(tier: AccountTier): number {
  const multipliers: Record<AccountTier, number> = {
    DIAMOND: 1.5,
    PLATINUM: 1.25,
    GOLD: 1.0,
    STANDARD: 0.8,
  };
  return multipliers[tier];
}

// ============================================
// ACCOUNT GENERATORS
// ============================================

export interface GeneratedAccount {
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: AccountTier;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  creditLimit: number;
  currentBalance: number;
  annualSpend: number;
  memberSince: Date;
  metadata: Record<string, unknown>;
  spendingProfile: SpendingProfile;
}

export interface SpendingProfile {
  primaryCategories: string[];
  avgTransactionAmount: number;
  transactionsPerMonth: number;
}

/**
 * Generate a single account with tier-appropriate attributes
 */
export function generateAccount(
  index: number,
  tierConfig: TierConfig
): GeneratedAccount {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const tierPrefix = tierConfig.tier.substring(0, 3).toUpperCase();

  // 95% active, 3% suspended, 2% closed
  const statusRoll = faker.number.float();
  const status: "ACTIVE" | "SUSPENDED" | "CLOSED" =
    statusRoll < 0.95 ? "ACTIVE" : statusRoll < 0.98 ? "SUSPENDED" : "CLOSED";

  const creditLimit = faker.number.int({
    min: tierConfig.creditLimitRange[0],
    max: tierConfig.creditLimitRange[1],
  });

  const annualSpend = faker.number.int({
    min: tierConfig.annualSpendRange[0],
    max: tierConfig.annualSpendRange[1],
  });

  // Current balance is 10-50% of credit limit
  const currentBalance =
    status === "CLOSED"
      ? 0
      : faker.number.int({
          min: Math.round(creditLimit * 0.1),
          max: Math.round(creditLimit * 0.5),
        });

  const avgTransactionAmount = faker.number.int({
    min: tierConfig.avgTransactionRange[0],
    max: tierConfig.avgTransactionRange[1],
  });

  // Transactions per month based on tier and spend
  const transactionsPerMonth = Math.round(
    annualSpend / 12 / avgTransactionAmount
  );

  // Assign primary spending categories based on random selection
  const allCategories = [
    "Travel",
    "Online Shopping",
    "Dining",
    "Groceries",
    "Gas Stations",
    "Retail",
  ];
  const numCategories = faker.number.int({ min: 2, max: 4 });
  const primaryCategories = faker.helpers.arrayElements(
    allCategories,
    numCategories
  );

  const channels = ["EMAIL", "MOBILE", "WEB"];
  const languages = ["en", "es", "fr"];

  return {
    accountNumber: `ACCT-${String(index + 1).padStart(3, "0")}-${tierPrefix}`,
    firstName,
    lastName,
    email: faker.internet
      .email({ firstName, lastName, provider: "email.com" })
      .toLowerCase(),
    tier: tierConfig.tier,
    status,
    creditLimit,
    currentBalance,
    annualSpend,
    memberSince: generateMemberSinceDate(tierConfig.memberSinceYearsRange),
    metadata: {
      preferredChannel: faker.helpers.arrayElement(channels),
      language: faker.helpers.weightedArrayElement([
        { weight: 85, value: "en" },
        { weight: 10, value: "es" },
        { weight: 5, value: "fr" },
      ]),
      ...(status === "SUSPENDED" && { suspensionReason: "payment_review" }),
      ...(status === "CLOSED" && { closedReason: "customer_request" }),
    },
    spendingProfile: {
      primaryCategories,
      avgTransactionAmount,
      transactionsPerMonth,
    },
  };
}

/**
 * Generate all accounts according to tier distribution
 */
export function generateAllAccounts(): GeneratedAccount[] {
  const accounts: GeneratedAccount[] = [];
  let index = 0;

  for (const tierConfig of TIER_CONFIGS) {
    for (let i = 0; i < tierConfig.count; i++) {
      accounts.push(generateAccount(index, tierConfig));
      index++;
    }
  }

  return accounts;
}

// ============================================
// TRANSACTION GENERATORS
// ============================================

export interface GeneratedTransaction {
  accountId: string;
  enrollmentId: string | null;
  transactionDate: Date;
  merchant: string;
  category: string;
  amount: number;
  qualifiesForOffer: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Generate transactions for an account based on their spending groups
 */
export function generateTransactionsForAccount(
  accountId: string,
  tier: AccountTier,
  spendingGroupMerchants: MerchantConfig[],
  transactionCount: number,
  enrollmentMap: Map<
    string,
    { enrollmentId: string; category: string; vendor: string | null }
  >
): GeneratedTransaction[] {
  const transactions: GeneratedTransaction[] = [];
  const tierMultiplier = getTierMultiplier(tier);

  // 70% from spending group categories, 30% general
  const groupTransactionCount = Math.round(transactionCount * 0.7);
  const generalTransactionCount = transactionCount - groupTransactionCount;

  // Generate spending group transactions
  for (let i = 0; i < groupTransactionCount; i++) {
    const merchant = faker.helpers.arrayElement(spendingGroupMerchants);
    const amount = generateTransactionAmount(merchant, tierMultiplier);
    const date = generateTransactionDate(90);

    // Check if this transaction qualifies for any enrollment
    let qualifiesForOffer = false;
    let enrollmentId: string | null = null;
    let qualificationMetadata: Record<string, unknown> = {};

    // Check enrollments for this account
    for (const [key, enrollment] of enrollmentMap.entries()) {
      if (key.startsWith(accountId)) {
        const matchesCategory = enrollment.category === merchant.category;
        const matchesVendor =
          !enrollment.vendor || enrollment.vendor === merchant.name;

        if (matchesCategory || matchesVendor) {
          qualifiesForOffer = true;
          enrollmentId = enrollment.enrollmentId;
          qualificationMetadata = {
            qualification: {
              qualified: true,
              reason: `Transaction matches ${
                enrollment.vendor || enrollment.category
              } offer criteria`,
              details: {
                merchantMatch: matchesVendor,
                categoryMatch: matchesCategory,
              },
            },
          };
          break;
        }
      }
    }

    if (!qualifiesForOffer) {
      qualificationMetadata = {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for this category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
          },
        },
      };
    }

    transactions.push({
      accountId,
      enrollmentId,
      transactionDate: date,
      merchant: merchant.name,
      category: merchant.category,
      amount,
      qualifiesForOffer,
      metadata: qualificationMetadata,
    });
  }

  // Generate general transactions
  for (let i = 0; i < generalTransactionCount; i++) {
    const merchant = faker.helpers.arrayElement(GENERAL_MERCHANTS);
    const amount = generateTransactionAmount(merchant, tierMultiplier);
    const date = generateTransactionDate(90);

    transactions.push({
      accountId,
      enrollmentId: null,
      transactionDate: date,
      merchant: merchant.name,
      category: merchant.category,
      amount,
      qualifiesForOffer: false,
      metadata: {
        qualification: {
          qualified: false,
          reason: "No active offer enrollment for this category",
          details: {
            categoryMatch: false,
            merchantMatch: false,
          },
        },
      },
    });
  }

  // Sort by date descending
  transactions.sort(
    (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()
  );

  return transactions;
}

// ============================================
// SPENDING GROUP ASSIGNMENT
// ============================================

export interface SpendingGroupAssignment {
  accountId: string;
  spendingGroupName: string;
  score: number;
}

/**
 * Assign accounts to spending groups based on tier and spending profile
 */
export function assignAccountsToSpendingGroups(
  accounts: Array<{
    id: string;
    tier: AccountTier;
    annualSpend: number;
    spendingProfile: SpendingProfile;
  }>
): Map<string, SpendingGroupAssignment[]> {
  const assignments = new Map<string, SpendingGroupAssignment[]>();

  for (const groupConfig of SPENDING_GROUP_CONFIGS) {
    const groupAssignments: SpendingGroupAssignment[] = [];

    // Filter eligible accounts
    const eligibleAccounts = accounts.filter((account) => {
      // Check tier eligibility
      if (!groupConfig.targetTiers.includes(account.tier)) {
        return false;
      }
      // Check minimum spend if specified
      if (
        groupConfig.minAnnualSpend &&
        account.annualSpend < groupConfig.minAnnualSpend
      ) {
        return false;
      }
      // Check if account has relevant spending categories
      const hasRelevantCategory =
        account.spendingProfile.primaryCategories.some((cat) =>
          groupConfig.categories.includes(cat)
        );
      return hasRelevantCategory || faker.number.float() < 0.3; // 30% chance to include anyway
    });

    // Select target number of accounts, with some randomness
    const selectedAccounts = faker.helpers.arrayElements(
      eligibleAccounts,
      Math.min(groupConfig.targetAccountCount, eligibleAccounts.length)
    );

    // Assign scores based on spending alignment
    for (const account of selectedAccounts) {
      const categoryOverlap = account.spendingProfile.primaryCategories.filter(
        (cat) => groupConfig.categories.includes(cat)
      ).length;

      // Score based on category overlap and tier
      const tierBonus =
        account.tier === "DIAMOND"
          ? 20
          : account.tier === "PLATINUM"
          ? 15
          : account.tier === "GOLD"
          ? 10
          : 5;
      const categoryBonus = categoryOverlap * 25;
      const randomFactor = faker.number.int({ min: 0, max: 15 });

      const score = Math.min(100, tierBonus + categoryBonus + randomFactor);

      groupAssignments.push({
        accountId: account.id,
        spendingGroupName: groupConfig.name,
        score,
      });
    }

    // Sort by score descending
    groupAssignments.sort((a, b) => b.score - a.score);
    assignments.set(groupConfig.name, groupAssignments);
  }

  return assignments;
}

/**
 * Get merchants for accounts based on their spending group memberships
 */
export function getMerchantsForAccount(
  accountId: string,
  groupAssignments: Map<string, SpendingGroupAssignment[]>
): MerchantConfig[] {
  const merchants: MerchantConfig[] = [];
  const seenMerchants = new Set<string>();

  for (const [groupName, assignments] of groupAssignments) {
    const isInGroup = assignments.some((a) => a.accountId === accountId);
    if (isInGroup) {
      const groupConfig = SPENDING_GROUP_CONFIGS.find(
        (g) => g.name === groupName
      );
      if (groupConfig) {
        for (const merchant of groupConfig.merchants) {
          if (!seenMerchants.has(merchant.name)) {
            merchants.push(merchant);
            seenMerchants.add(merchant.name);
          }
        }
      }
    }
  }

  // If no group merchants, use general merchants
  if (merchants.length === 0) {
    return [...GENERAL_MERCHANTS];
  }

  return merchants;
}
