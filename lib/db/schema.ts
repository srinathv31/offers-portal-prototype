/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT",
  "IN_REVIEW",
  "TESTING",
  "LIVE",
  "ENDED",
]);

export const offerTypeEnum = pgEnum("offer_type", [
  "POINTS_MULTIPLIER",
  "CASHBACK",
  "DISCOUNT",
  "BONUS",
]);

export const segmentSourceEnum = pgEnum("segment_source", [
  "CDC",
  "RAHONA",
  "CUSTOM",
]);

export const fulfillmentMethodEnum = pgEnum("fulfillment_method", [
  "REWARDS",
  "STATEMENT_CREDIT",
  "INCENTIVE_FILE",
]);

export const approvalDecisionEnum = pgEnum("approval_decision", [
  "APPROVED",
  "REJECTED",
  "PENDING",
]);

export const controlResultEnum = pgEnum("control_result", [
  "PASS",
  "WARN",
  "FAIL",
]);

// New enums for account-level tracking
export const accountTierEnum = pgEnum("account_tier", [
  "STANDARD",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "ENROLLED",
  "IN_PROGRESS",
  "COMPLETED",
  "EXPIRED",
  "OPTED_OUT",
]);

export const creditCardProductEnum = pgEnum("credit_card_product", [
  "FLEXPAY",
  "DOUBLE_UP",
  "CASH_CREDIT",
  "FIRST_CLASS",
  "CLEAR",
]);

// TypeScript types from enums
export type CampaignStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "TESTING"
  | "LIVE"
  | "ENDED";
export type OfferType = "POINTS_MULTIPLIER" | "CASHBACK" | "DISCOUNT" | "BONUS";
export type SegmentSource = "CDC" | "RAHONA" | "CUSTOM";
export type FulfillmentMethod =
  | "REWARDS"
  | "STATEMENT_CREDIT"
  | "INCENTIVE_FILE";
export type ApprovalDecision = "APPROVED" | "REJECTED" | "PENDING";
export type ControlResult = "PASS" | "WARN" | "FAIL";
export type AccountTier = "STANDARD" | "GOLD" | "PLATINUM" | "DIAMOND";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "CLOSED";
export type EnrollmentStatus =
  | "ENROLLED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "OPTED_OUT";
export type CreditCardProduct =
  | "FLEXPAY"
  | "DOUBLE_UP"
  | "CASH_CREDIT"
  | "FIRST_CLASS"
  | "CLEAR";

// ==========================================
// ACCOUNT-LEVEL TABLES
// ==========================================

// Accounts - Core account entity with full details
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountNumber: text("account_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  tier: accountTierEnum("tier").notNull().default("STANDARD"),
  status: accountStatusEnum("status").notNull().default("ACTIVE"),
  creditLimit: integer("credit_limit").notNull(), // in cents
  currentBalance: integer("current_balance").notNull().default(0), // in cents
  annualSpend: integer("annual_spend").notNull().default(0), // cached aggregate in cents
  memberSince: timestamp("member_since").notNull(),
  metadata: jsonb("metadata").default({}).$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Spending Groups - Groupings of accounts by spending behavior
export const spendingGroups = pgTable("spending_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").default({}).$type<{
    minAnnualSpend?: number;
    maxAnnualSpend?: number;
    tiers?: AccountTier[];
    categories?: string[];
    minTransactions?: number;
  }>(),
  accountCount: integer("account_count").notNull().default(0), // cached count
  avgSpend: integer("avg_spend").notNull().default(0), // cached average in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Junction: Accounts to Spending Groups
export const spendingGroupAccounts = pgTable("spending_group_accounts", {
  spendingGroupId: uuid("spending_group_id")
    .notNull()
    .references(() => spendingGroups.id),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  score: integer("score"), // optional ranking within group
});

// Account Offer Enrollments - Tracks account enrollment in offers with progress
export const accountOfferEnrollments = pgTable("account_offer_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id),
  campaignId: uuid("campaign_id").references(() => campaigns.id), // nullable - which campaign enrolled them
  status: enrollmentStatusEnum("status").notNull().default("ENROLLED"),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // nullable
  targetAmount: integer("target_amount"), // e.g., $1000 in cents
  currentProgress: integer("current_progress").notNull().default(0), // cached progress amount in cents
  progressPct: numeric("progress_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("0"), // calculated percentage
  completedAt: timestamp("completed_at"), // nullable
  rewardEarned: integer("reward_earned"), // nullable, in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Credit Cards - Individual credit card entities
export const creditCards = pgTable("credit_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  creditCardProduct: creditCardProductEnum("credit_card_product").notNull(),
  cardNumber: text("card_number").notNull(), // masked like ****1234
  lastFourDigits: text("last_four_digits").notNull(),
  creditLimit: integer("credit_limit").notNull(), // in cents
  currentBalance: integer("current_balance").notNull().default(0), // in cents
  openedAt: timestamp("opened_at").notNull(),
  expirationDate: timestamp("expiration_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Junction: Accounts to Credit Cards with usage metadata
export const accountCreditCards = pgTable("account_credit_cards", {
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  creditCardId: uuid("credit_card_id")
    .notNull()
    .references(() => creditCards.id),
  isPrimary: boolean("is_primary").notNull().default(false),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  preferredForCategory: text("preferred_for_category"), // e.g., "Dining", "Travel"
});

// Account Transactions - Individual transactions for progress tracking
export const accountTransactions = pgTable("account_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id),
  creditCardId: uuid("credit_card_id").references(() => creditCards.id), // which card was used
  enrollmentId: uuid("enrollment_id").references(
    () => accountOfferEnrollments.id
  ), // nullable - links to specific offer enrollment
  transactionDate: timestamp("transaction_date").notNull(),
  merchant: text("merchant").notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(), // in cents
  qualifiesForOffer: boolean("qualifies_for_offer").notNull().default(false),
  metadata: jsonb("metadata").default({}).$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// CAMPAIGN & OFFER TABLES
// ==========================================

// Tables
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  status: campaignStatusEnum("status").notNull().default("DRAFT"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  ownerIds: jsonb("owner_ids").default([]).$type<string[]>(),
  metrics: jsonb("metrics").default({}).$type<{
    activations?: number;
    cost?: number;
    projected_lift_pct?: number;
    error_rate_pct?: number;
    revenue?: number;
  }>(),
  channelPlanId: uuid("channel_plan_id"),
  fulfillmentPlanId: uuid("fulfillment_plan_id"),
  controlChecklistId: uuid("control_checklist_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const offers = pgTable("offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: offerTypeEnum("type").notNull(),
  vendor: text("vendor"),
  parameters: jsonb("parameters").default({}).$type<Record<string, any>>(),
  // Progress tracking fields
  hasProgressTracking: boolean("has_progress_tracking")
    .notNull()
    .default(false),
  progressTarget: jsonb("progress_target").$type<{
    targetAmount?: number; // in cents
    category?: string;
    vendor?: string;
    timeframeDays?: number;
  } | null>(),
  effectiveFrom: timestamp("effective_from"),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const segments = pgTable("segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  source: segmentSourceEnum("source").notNull(),
  definitionJson: jsonb("definition_json")
    .default({})
    .$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eligibilityRules = pgTable("eligibility_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  dsl: text("dsl").notNull(),
  dataDependencies: jsonb("data_dependencies").default([]).$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const channelPlans = pgTable("channel_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  channels: jsonb("channels").default([]).$type<string[]>(),
  creatives: jsonb("creatives")
    .default([])
    .$type<Array<{ channel: string; preview: string }>>(),
  dynamicTnc: text("dynamic_tnc"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fulfillmentPlans = pgTable("fulfillment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  method: fulfillmentMethodEnum("method").notNull(),
  mockAdapter: text("mock_adapter").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const controlChecklists = pgTable("control_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  items: jsonb("items")
    .default([])
    .$type<
      Array<{ name: string; result: ControlResult; evidence_ref?: string }>
    >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id),
  role: text("role").notNull(),
  actor: text("actor"),
  decision: approvalDecisionEnum("decision").notNull().default("PENDING"),
  timestamp: timestamp("timestamp"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const simulationRuns = pgTable("simulation_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id),
  inputs: jsonb("inputs").default({}).$type<Record<string, any>>(),
  cohortSize: jsonb("cohort_size").$type<number>(),
  projections: jsonb("projections").default({}).$type<{
    revenue?: number;
    activations?: number;
    error_rate_pct?: number;
  }>(),
  steps: jsonb("steps").default([]).$type<
    Array<{
      key: string;
      label: string;
      status: "PENDING" | "RUNNING" | "DONE" | "FAIL";
    }>
  >(),
  finished: boolean("finished").notNull().default(false),
  success: boolean("success").default(false),
  errors: jsonb("errors")
    .default([])
    .$type<Array<{ message: string; step?: string }>>(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload").default({}).$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Junction tables for many-to-many relationships
export const campaignOffers = pgTable("campaign_offers", {
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id),
});

export const campaignSegments = pgTable("campaign_segments", {
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id),
  segmentId: uuid("segment_id")
    .notNull()
    .references(() => segments.id),
});

export const campaignEligibilityRules = pgTable("campaign_eligibility_rules", {
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id),
  eligibilityRuleId: uuid("eligibility_rule_id")
    .notNull()
    .references(() => eligibilityRules.id),
});

// Junction: Segments reference Spending Groups
export const segmentSpendingGroups = pgTable("segment_spending_groups", {
  segmentId: uuid("segment_id")
    .notNull()
    .references(() => segments.id),
  spendingGroupId: uuid("spending_group_id")
    .notNull()
    .references(() => spendingGroups.id),
});

// ==========================================
// RELATIONS
// ==========================================

// Relations
export const campaignsRelations = relations(campaigns, ({ many, one }) => ({
  campaignOffers: many(campaignOffers),
  campaignSegments: many(campaignSegments),
  campaignEligibilityRules: many(campaignEligibilityRules),
  approvals: many(approvals),
  simulationRuns: many(simulationRuns),
  auditLogs: many(auditLogs),
  accountOfferEnrollments: many(accountOfferEnrollments),
  channelPlan: one(channelPlans, {
    fields: [campaigns.channelPlanId],
    references: [channelPlans.id],
  }),
  fulfillmentPlan: one(fulfillmentPlans, {
    fields: [campaigns.fulfillmentPlanId],
    references: [fulfillmentPlans.id],
  }),
  controlChecklist: one(controlChecklists, {
    fields: [campaigns.controlChecklistId],
    references: [controlChecklists.id],
  }),
}));

export const offersRelations = relations(offers, ({ many }) => ({
  campaignOffers: many(campaignOffers),
  accountOfferEnrollments: many(accountOfferEnrollments),
}));

export const segmentsRelations = relations(segments, ({ many }) => ({
  campaignSegments: many(campaignSegments),
  segmentSpendingGroups: many(segmentSpendingGroups),
}));

// Account-level relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  spendingGroupAccounts: many(spendingGroupAccounts),
  accountOfferEnrollments: many(accountOfferEnrollments),
  accountTransactions: many(accountTransactions),
  accountCreditCards: many(accountCreditCards),
}));

export const spendingGroupsRelations = relations(
  spendingGroups,
  ({ many }) => ({
    spendingGroupAccounts: many(spendingGroupAccounts),
    segmentSpendingGroups: many(segmentSpendingGroups),
  })
);

export const spendingGroupAccountsRelations = relations(
  spendingGroupAccounts,
  ({ one }) => ({
    spendingGroup: one(spendingGroups, {
      fields: [spendingGroupAccounts.spendingGroupId],
      references: [spendingGroups.id],
    }),
    account: one(accounts, {
      fields: [spendingGroupAccounts.accountId],
      references: [accounts.id],
    }),
  })
);

export const segmentSpendingGroupsRelations = relations(
  segmentSpendingGroups,
  ({ one }) => ({
    segment: one(segments, {
      fields: [segmentSpendingGroups.segmentId],
      references: [segments.id],
    }),
    spendingGroup: one(spendingGroups, {
      fields: [segmentSpendingGroups.spendingGroupId],
      references: [spendingGroups.id],
    }),
  })
);

export const accountOfferEnrollmentsRelations = relations(
  accountOfferEnrollments,
  ({ one, many }) => ({
    account: one(accounts, {
      fields: [accountOfferEnrollments.accountId],
      references: [accounts.id],
    }),
    offer: one(offers, {
      fields: [accountOfferEnrollments.offerId],
      references: [offers.id],
    }),
    campaign: one(campaigns, {
      fields: [accountOfferEnrollments.campaignId],
      references: [campaigns.id],
    }),
    transactions: many(accountTransactions),
  })
);

export const accountTransactionsRelations = relations(
  accountTransactions,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accountTransactions.accountId],
      references: [accounts.id],
    }),
    enrollment: one(accountOfferEnrollments, {
      fields: [accountTransactions.enrollmentId],
      references: [accountOfferEnrollments.id],
    }),
    creditCard: one(creditCards, {
      fields: [accountTransactions.creditCardId],
      references: [creditCards.id],
    }),
  })
);

// Credit Card relations
export const creditCardsRelations = relations(creditCards, ({ many }) => ({
  accountCreditCards: many(accountCreditCards),
  accountTransactions: many(accountTransactions),
}));

export const accountCreditCardsRelations = relations(
  accountCreditCards,
  ({ one }) => ({
    account: one(accounts, {
      fields: [accountCreditCards.accountId],
      references: [accounts.id],
    }),
    creditCard: one(creditCards, {
      fields: [accountCreditCards.creditCardId],
      references: [creditCards.id],
    }),
  })
);

export const eligibilityRulesRelations = relations(
  eligibilityRules,
  ({ many }) => ({
    campaignEligibilityRules: many(campaignEligibilityRules),
  })
);

export const campaignOffersRelations = relations(campaignOffers, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignOffers.campaignId],
    references: [campaigns.id],
  }),
  offer: one(offers, {
    fields: [campaignOffers.offerId],
    references: [offers.id],
  }),
}));

export const campaignSegmentsRelations = relations(
  campaignSegments,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignSegments.campaignId],
      references: [campaigns.id],
    }),
    segment: one(segments, {
      fields: [campaignSegments.segmentId],
      references: [segments.id],
    }),
  })
);

export const campaignEligibilityRulesRelations = relations(
  campaignEligibilityRules,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignEligibilityRules.campaignId],
      references: [campaigns.id],
    }),
    eligibilityRule: one(eligibilityRules, {
      fields: [campaignEligibilityRules.eligibilityRuleId],
      references: [eligibilityRules.id],
    }),
  })
);

export const approvalsRelations = relations(approvals, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [approvals.campaignId],
    references: [campaigns.id],
  }),
}));

export const simulationRunsRelations = relations(simulationRuns, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [simulationRuns.campaignId],
    references: [campaigns.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [auditLogs.campaignId],
    references: [campaigns.id],
  }),
}));
