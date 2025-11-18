import { pgTable, uuid, text, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
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

export const segmentSourceEnum = pgEnum("segment_source", ["CDC", "RAHONA", "CUSTOM"]);

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

export const controlResultEnum = pgEnum("control_result", ["PASS", "WARN", "FAIL"]);

// TypeScript types from enums
export type CampaignStatus = "DRAFT" | "IN_REVIEW" | "TESTING" | "LIVE" | "ENDED";
export type OfferType = "POINTS_MULTIPLIER" | "CASHBACK" | "DISCOUNT" | "BONUS";
export type SegmentSource = "CDC" | "RAHONA" | "CUSTOM";
export type FulfillmentMethod = "REWARDS" | "STATEMENT_CREDIT" | "INCENTIVE_FILE";
export type ApprovalDecision = "APPROVED" | "REJECTED" | "PENDING";
export type ControlResult = "PASS" | "WARN" | "FAIL";

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
  effectiveFrom: timestamp("effective_from"),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const segments = pgTable("segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  source: segmentSourceEnum("source").notNull(),
  definitionJson: jsonb("definition_json").default({}).$type<Record<string, any>>(),
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
  creatives: jsonb("creatives").default([]).$type<
    Array<{ channel: string; preview: string }>
  >(),
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
  items: jsonb("items").default([]).$type<
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
    Array<{ key: string; label: string; status: "PENDING" | "RUNNING" | "DONE" | "FAIL" }>
  >(),
  finished: boolean("finished").notNull().default(false),
  success: boolean("success").default(false),
  errors: jsonb("errors").default([]).$type<Array<{ message: string; step?: string }>>(),
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

// Relations
export const campaignsRelations = relations(campaigns, ({ many, one }) => ({
  campaignOffers: many(campaignOffers),
  campaignSegments: many(campaignSegments),
  campaignEligibilityRules: many(campaignEligibilityRules),
  approvals: many(approvals),
  simulationRuns: many(simulationRuns),
  auditLogs: many(auditLogs),
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
}));

export const segmentsRelations = relations(segments, ({ many }) => ({
  campaignSegments: many(campaignSegments),
}));

export const eligibilityRulesRelations = relations(eligibilityRules, ({ many }) => ({
  campaignEligibilityRules: many(campaignEligibilityRules),
}));

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

export const campaignSegmentsRelations = relations(campaignSegments, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [campaignSegments.campaignId],
    references: [campaigns.id],
  }),
  segment: one(segments, {
    fields: [campaignSegments.segmentId],
    references: [segments.id],
  }),
}));

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

