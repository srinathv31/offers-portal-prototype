import { db } from "../index";
import * as schema from "../schema";

interface SeedCampaignsDeps {
  offers: Array<{ id: string }>;
  segments: Array<{ id: string }>;
  rules: Array<{ id: string }>;
  channelPlanId: string;
  fulfillmentPlanId: string;
  controlChecklistId: string;
}

/**
 * Seed campaigns with all related data
 * Creates 3 campaigns with approvals, audit logs, and E2E simulation run
 */
export async function seedCampaigns(deps: SeedCampaignsDeps) {
  const {
    offers,
    segments,
    rules,
    channelPlanId,
    fulfillmentPlanId,
    controlChecklistId,
  } = deps;

  console.log("Creating campaigns...");

  // Campaign 1: Holiday Rewards Blitz (LIVE)
  const [campaign1] = await db
    .insert(schema.campaigns)
    .values({
      name: "Holiday Rewards Blitz",
      purpose:
        "Drive holiday spending by offering enhanced rewards on popular retail partners (Amazon, Target, Starbucks)",
      status: "LIVE",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-12-31"),
      ownerIds: ["sarah.marketing@example.com", "john.product@example.com"],
      metrics: {
        activations: 45200,
        cost: 125000,
        projected_lift_pct: 18.5,
        error_rate_pct: 0.8,
        revenue: 2850000,
      },
      channelPlanId,
      fulfillmentPlanId,
      controlChecklistId,
    })
    .returning();

  // Link offers to campaign 1 (Amazon, Target, Starbucks)
  await db.insert(schema.campaignOffers).values([
    { campaignId: campaign1.id, offerId: offers[0].id }, // Amazon 3× Points
    { campaignId: campaign1.id, offerId: offers[1].id }, // Target 5% Weekend
    { campaignId: campaign1.id, offerId: offers[2].id }, // Starbucks Bonus
  ]);

  // Link segments to campaign 1
  await db.insert(schema.campaignSegments).values([
    { campaignId: campaign1.id, segmentId: segments[0].id }, // Holiday High Spenders
    { campaignId: campaign1.id, segmentId: segments[1].id }, // Amazon Enthusiasts
  ]);

  // Link eligibility rules to campaign 1
  await db
    .insert(schema.campaignEligibilityRules)
    .values([{ campaignId: campaign1.id, eligibilityRuleId: rules[0].id }]);

  // Create approvals for campaign 1
  await db.insert(schema.approvals).values([
    {
      campaignId: campaign1.id,
      role: "Product Owner",
      actor: "john.product@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-10-25T10:30:00Z"),
    },
    {
      campaignId: campaign1.id,
      role: "Risk & Compliance",
      actor: "lisa.compliance@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-10-26T14:15:00Z"),
    },
    {
      campaignId: campaign1.id,
      role: "Marketing Ops",
      actor: "sarah.marketing@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-10-27T09:00:00Z"),
    },
  ]);

  console.log("✓ Created campaign: Holiday Rewards Blitz (LIVE)");

  // Campaign 2: Q1 Travel Perks (IN_REVIEW)
  const [campaign2] = await db
    .insert(schema.campaigns)
    .values({
      name: "Q1 Travel Perks",
      purpose:
        "Capitalize on Q1 travel planning season with enhanced miles and travel-related rewards",
      status: "IN_REVIEW",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-03-31"),
      ownerIds: ["michael.strategy@example.com"],
      metrics: {
        activations: 0,
        cost: 0,
        projected_lift_pct: 22.0,
        error_rate_pct: 0,
        revenue: 0,
      },
      channelPlanId,
      fulfillmentPlanId,
      controlChecklistId,
    })
    .returning();

  // Link offers to campaign 2 (Travel Miles Accelerator, Dining Cashback)
  await db.insert(schema.campaignOffers).values([
    { campaignId: campaign2.id, offerId: offers[4].id }, // Travel Miles Accelerator
    { campaignId: campaign2.id, offerId: offers[5].id }, // Dining Cashback
  ]);

  // Link segments to campaign 2
  await db.insert(schema.campaignSegments).values([
    { campaignId: campaign2.id, segmentId: segments[2].id }, // Travel Frequent Flyers
  ]);

  // Link eligibility rules to campaign 2
  await db.insert(schema.campaignEligibilityRules).values([
    { campaignId: campaign2.id, eligibilityRuleId: rules[0].id },
    { campaignId: campaign2.id, eligibilityRuleId: rules[1].id },
  ]);

  // Create approvals for campaign 2 (pending)
  await db.insert(schema.approvals).values([
    {
      campaignId: campaign2.id,
      role: "Product Owner",
      actor: null,
      decision: "PENDING",
      timestamp: null,
    },
    {
      campaignId: campaign2.id,
      role: "Risk & Compliance",
      actor: null,
      decision: "PENDING",
      timestamp: null,
    },
    {
      campaignId: campaign2.id,
      role: "Marketing Ops",
      actor: "sarah.marketing@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-11-05T11:20:00Z"),
    },
  ]);

  console.log("✓ Created campaign: Q1 Travel Perks (IN_REVIEW)");

  // Campaign 3: Summer Cashback (ENDED)
  const [campaign3] = await db
    .insert(schema.campaigns)
    .values({
      name: "Summer Cashback",
      purpose:
        "Summer promotional campaign with focus on groceries, gas, and fitness rewards",
      status: "ENDED",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-08-31"),
      ownerIds: ["sarah.marketing@example.com"],
      metrics: {
        activations: 62800,
        cost: 185000,
        projected_lift_pct: 15.2,
        error_rate_pct: 1.2,
        revenue: 3250000,
      },
      channelPlanId,
      fulfillmentPlanId,
      controlChecklistId,
    })
    .returning();

  // Link offers to campaign 3 (Recurring Groceries, Gas Station, Fitness)
  await db.insert(schema.campaignOffers).values([
    { campaignId: campaign3.id, offerId: offers[3].id }, // Recurring Groceries Booster
    { campaignId: campaign3.id, offerId: offers[6].id }, // Gas Station Rewards
    { campaignId: campaign3.id, offerId: offers[7].id }, // Fitness Membership Discount
  ]);

  // Link segments to campaign 3
  await db.insert(schema.campaignSegments).values([
    { campaignId: campaign3.id, segmentId: segments[0].id }, // Holiday High Spenders
  ]);

  // Link eligibility rules to campaign 3
  await db
    .insert(schema.campaignEligibilityRules)
    .values([{ campaignId: campaign3.id, eligibilityRuleId: rules[0].id }]);

  // Create approvals for campaign 3 (all approved)
  await db.insert(schema.approvals).values([
    {
      campaignId: campaign3.id,
      role: "Product Owner",
      actor: "john.product@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-05-15T09:30:00Z"),
    },
    {
      campaignId: campaign3.id,
      role: "Risk & Compliance",
      actor: "lisa.compliance@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-05-16T13:45:00Z"),
    },
    {
      campaignId: campaign3.id,
      role: "Marketing Ops",
      actor: "sarah.marketing@example.com",
      decision: "APPROVED",
      timestamp: new Date("2025-05-17T10:00:00Z"),
    },
  ]);

  console.log("✓ Created campaign: Summer Cashback (ENDED)");

  // Create audit log entries
  console.log("Creating audit logs...");
  await db.insert(schema.auditLogs).values([
    {
      campaignId: campaign1.id,
      actor: "sarah.marketing@example.com",
      action: "CAMPAIGN_CREATED",
      payload: { method: "manual" },
      timestamp: new Date("2025-10-20T08:00:00Z"),
    },
    {
      campaignId: campaign1.id,
      actor: "system",
      action: "AUTO_CONTROLS_PASSED",
      payload: { checklistId: controlChecklistId },
      timestamp: new Date("2025-10-27T09:30:00Z"),
    },
    {
      campaignId: campaign1.id,
      actor: "sarah.marketing@example.com",
      action: "CAMPAIGN_PUBLISHED",
      payload: { startDate: "2025-11-01" },
      timestamp: new Date("2025-10-28T10:00:00Z"),
    },
    {
      campaignId: campaign2.id,
      actor: "michael.strategy@example.com",
      action: "CAMPAIGN_CREATED",
      payload: { method: "ai_suggested" },
      timestamp: new Date("2025-11-01T14:30:00Z"),
    },
  ]);
  console.log("✓ Created audit logs");

  // Create E2E simulation run for campaign 2
  console.log("Creating simulation runs...");
  await db.insert(schema.simulationRuns).values({
    campaignId: campaign2.id,
    simulationType: "E2E_TEST",
    inputs: {
      cohortSize: 42000,
      testPercentage: 5,
      duration: "30 days",
    },
    cohortSize: 42000,
    projections: {
      revenue: 1850000,
      activations: 18500,
      error_rate_pct: 0.5,
    },
    steps: [
      { key: "rules-compile", label: "Rules Compilation", status: "DONE" },
      {
        key: "data-availability",
        label: "Data Availability Check",
        status: "DONE",
      },
      {
        key: "channel-mock",
        label: "Channel Distribution Mock",
        status: "DONE",
      },
      {
        key: "presentment",
        label: "Offer Presentment Simulation",
        status: "DONE",
      },
      { key: "disposition", label: "Disposition Processing", status: "DONE" },
      { key: "fulfillment", label: "Fulfillment Simulation", status: "DONE" },
      { key: "report", label: "Report Generation", status: "DONE" },
    ],
    finished: true,
    success: true,
    errors: [],
    startedAt: new Date("2025-11-02T10:00:00Z"),
    finishedAt: new Date("2025-11-02T10:05:30Z"),
  });
  console.log("✓ Created E2E test simulation run");

  return { campaign1, campaign2, campaign3 };
}

