import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  uuid,
  pgEnum,
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

// Tables
export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  status: campaignStatusEnum("status").notNull().default("DRAFT"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  ownerIds: jsonb("owner_ids").$type<string[]>().default([]),
  metrics: jsonb("metrics")
    .$type<{
      activations?: number;
      revenue?: number;
      projectedLiftPct?: number;
      errorRatePct?: number;
      cost?: number;
    }>()
    .default({}),
  channelPlanId: uuid("channel_plan_id"),
  fulfillmentPlanId: uuid("fulfillment_plan_id"),
  controlChecklistId: uuid("control_checklist_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: offerTypeEnum("type").notNull(),
  vendor: text("vendor"),
  parameters: jsonb("parameters").$type<Record<string, unknown>>().default({}),
  effectiveFrom: timestamp("effective_from"),
  effectiveTo: timestamp("effective_to"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const segments = pgTable("segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  source: segmentSourceEnum("source").notNull(),
  definitionJson: jsonb("definition_json")
    .$type<Record<string, unknown>>()
    .default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const eligibilityRules = pgTable("eligibility_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  dsl: text("dsl").notNull(),
  dataDependencies: jsonb("data_dependencies").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channelPlans = pgTable("channel_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  channels: jsonb("channels").$type<string[]>().default([]),
  creatives: jsonb("creatives")
    .$type<
      Array<{
        channel: string;
        preview: string;
      }>
    >()
    .default([]),
  dynamicTnc: text("dynamic_tnc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fulfillmentPlans = pgTable("fulfillment_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  method: fulfillmentMethodEnum("method").notNull(),
  mockAdapter: text("mock_adapter").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const controlChecklists = pgTable("control_checklists", {
  id: uuid("id").defaultRandom().primaryKey(),
  items: jsonb("items")
    .$type<
      Array<{
        name: string;
        result: "PASS" | "WARN" | "FAIL";
        evidenceRef?: string;
      }>
    >()
    .default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  role: text("role").notNull(),
  actor: text("actor"),
  decision: approvalDecisionEnum("decision").notNull().default("PENDING"),
  timestamp: timestamp("timestamp"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const simulationRuns = pgTable("simulation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().default({}),
  cohortSize: jsonb("cohort_size").$type<number>(),
  projections: jsonb("projections")
    .$type<{
      revenue?: number;
      errorRate?: number;
    }>()
    .default({}),
  steps: jsonb("steps")
    .$type<
      Array<{
        key: string;
        label: string;
        status: "PENDING" | "RUNNING" | "DONE" | "FAIL";
      }>
    >()
    .default([]),
  finished: boolean("finished").default(false).notNull(),
  success: boolean("success").default(false),
  errors: jsonb("errors").$type<unknown[]>().default([]),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Junction tables
export const campaignOffers = pgTable("campaign_offers", {
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  offerId: uuid("offer_id")
    .references(() => offers.id)
    .notNull(),
});

export const campaignSegments = pgTable("campaign_segments", {
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  segmentId: uuid("segment_id")
    .references(() => segments.id)
    .notNull(),
});

export const campaignEligibilityRules = pgTable("campaign_eligibility_rules", {
  campaignId: uuid("campaign_id")
    .references(() => campaigns.id)
    .notNull(),
  eligibilityRuleId: uuid("eligibility_rule_id")
    .references(() => eligibilityRules.id)
    .notNull(),
});

// Relations
export const campaignsRelations = relations(campaigns, ({ many, one }) => ({
  offers: many(campaignOffers),
  segments: many(campaignSegments),
  eligibilityRules: many(campaignEligibilityRules),
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
  campaigns: many(campaignOffers),
}));

export const segmentsRelations = relations(segments, ({ many }) => ({
  campaigns: many(campaignSegments),
}));

export const eligibilityRulesRelations = relations(
  eligibilityRules,
  ({ many }) => ({
    campaigns: many(campaignEligibilityRules),
  })
);
