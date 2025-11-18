import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");
  await db.delete(schema.auditLogs);
  await db.delete(schema.simulationRuns);
  await db.delete(schema.approvals);
  await db.delete(schema.campaignEligibilityRules);
  await db.delete(schema.campaignSegments);
  await db.delete(schema.campaignOffers);
  await db.delete(schema.campaigns);
  await db.delete(schema.offers);
  await db.delete(schema.segments);
  await db.delete(schema.eligibilityRules);
  await db.delete(schema.channelPlans);
  await db.delete(schema.fulfillmentPlans);
  await db.delete(schema.controlChecklists);

  // Create offers
  console.log("Creating offers...");
  const offersData = [
    {
      name: "Amazon 3× Points",
      type: "POINTS_MULTIPLIER" as const,
      vendor: "Amazon",
      parameters: {
        multiplier: 3,
        basePoints: 1,
        category: "Online Shopping",
        minPurchase: 25,
      },
    },
    {
      name: "Target 5% Weekend",
      type: "CASHBACK" as const,
      vendor: "Target",
      parameters: {
        cashbackPercent: 5,
        daysOfWeek: ["Saturday", "Sunday"],
        maxCashback: 50,
      },
    },
    {
      name: "Starbucks Bonus",
      type: "BONUS" as const,
      vendor: "Starbucks",
      parameters: {
        bonusPoints: 500,
        minSpend: 50,
        timeframe: "30 days",
      },
    },
    {
      name: "Recurring Groceries Booster",
      type: "POINTS_MULTIPLIER" as const,
      vendor: null,
      parameters: {
        multiplier: 2,
        category: "Groceries",
        recurring: true,
        minMonthlySpend: 100,
      },
    },
    {
      name: "Travel Miles Accelerator",
      type: "POINTS_MULTIPLIER" as const,
      vendor: null,
      parameters: {
        multiplier: 5,
        category: "Travel",
        includesAirlines: true,
        includesHotels: true,
      },
    },
    {
      name: "Dining Cashback",
      type: "CASHBACK" as const,
      vendor: null,
      parameters: {
        cashbackPercent: 3,
        category: "Dining",
        maxCashback: 75,
      },
    },
    {
      name: "Gas Station Rewards",
      type: "POINTS_MULTIPLIER" as const,
      vendor: null,
      parameters: {
        multiplier: 3,
        category: "Gas Stations",
        maxPointsPerMonth: 5000,
      },
    },
    {
      name: "Fitness Membership Discount",
      type: "DISCOUNT" as const,
      vendor: "Nike",
      parameters: {
        discountPercent: 15,
        category: "Fitness",
        validVendors: ["Nike", "Adidas", "Lululemon"],
      },
    },
  ];

  const createdOffers = await db.insert(schema.offers).values(offersData).returning();
  console.log(`✓ Created ${createdOffers.length} offers`);

  // Create segments
  console.log("Creating segments...");
  const segmentsData = [
    {
      name: "Holiday High Spenders",
      source: "CDC" as const,
      definitionJson: {
        criteria: {
          annualSpend: { min: 50000 },
          lastPurchaseDate: { within: "90 days" },
          seasonalActivity: "high",
        },
        estimatedSize: 125000,
      },
    },
    {
      name: "Amazon Enthusiasts",
      source: "RAHONA" as const,
      definitionJson: {
        criteria: {
          vendor: "Amazon",
          monthlyTransactions: { min: 5 },
          avgTransactionAmount: { min: 75 },
        },
        estimatedSize: 85000,
      },
    },
    {
      name: "Travel Frequent Flyers",
      source: "CUSTOM" as const,
      definitionJson: {
        criteria: {
          category: "Travel",
          annualSpend: { min: 10000 },
          travelFrequency: "monthly",
        },
        estimatedSize: 42000,
      },
    },
  ];

  const createdSegments = await db.insert(schema.segments).values(segmentsData).returning();
  console.log(`✓ Created ${createdSegments.length} segments`);

  // Create eligibility rules
  console.log("Creating eligibility rules...");
  const rulesData = [
    {
      dsl: "(account.status == 'ACTIVE') AND (account.delinquency_days < 30) AND (credit_score >= 650)",
      dataDependencies: ["account.status", "account.delinquency_days", "credit_score"],
    },
    {
      dsl: "(account.tenure_months >= 6) AND (account.avg_monthly_spend >= 500) AND (opt_in.marketing == true)",
      dataDependencies: ["account.tenure_months", "account.avg_monthly_spend", "opt_in.marketing"],
    },
  ];

  const createdRules = await db.insert(schema.eligibilityRules).values(rulesData).returning();
  console.log(`✓ Created ${createdRules.length} eligibility rules`);

  // Create channel plan
  console.log("Creating channel plan...");
  const channelPlanData = {
    channels: ["EMAIL", "MOBILE", "WEB"],
    creatives: [
      {
        channel: "EMAIL",
        preview: "Holiday rewards are here! Earn 3× points on your favorite brands.",
      },
      {
        channel: "MOBILE",
        preview: "🎁 Special Holiday Offer: Triple points on Amazon, Target & more!",
      },
      {
        channel: "WEB",
        preview: "Banner: Exclusive Holiday Rewards - Limited Time Only",
      },
    ],
    dynamicTnc: "Offer valid through 12/31/2025. Points earned will post within 2 billing cycles. See full terms at example.com/terms.",
  };

  const [createdChannelPlan] = await db
    .insert(schema.channelPlans)
    .values(channelPlanData)
    .returning();
  console.log("✓ Created channel plan");

  // Create fulfillment plan
  console.log("Creating fulfillment plan...");
  const fulfillmentPlanData = {
    method: "REWARDS" as const,
    mockAdapter: "REWARDS_ENGINE",
  };

  const [createdFulfillmentPlan] = await db
    .insert(schema.fulfillmentPlans)
    .values(fulfillmentPlanData)
    .returning();
  console.log("✓ Created fulfillment plan");

  // Create control checklist
  console.log("Creating control checklist...");
  const controlChecklistData = {
    items: [
      {
        name: "PII Minimization",
        result: "PASS" as const,
        evidence_ref: "privacy-audit-2025-001",
      },
      {
        name: "T&Cs Consistency Check",
        result: "PASS" as const,
        evidence_ref: "legal-review-2025-002",
      },
      {
        name: "7-Year Retention Compliance",
        result: "WARN" as const,
        evidence_ref: "retention-policy-check",
      },
      {
        name: "Segregation of Duties (SoD)",
        result: "PASS" as const,
        evidence_ref: "sod-matrix-verified",
      },
      {
        name: "Data Source Availability",
        result: "PASS" as const,
        evidence_ref: "data-lineage-check-2025",
      },
    ],
  };

  const [createdControlChecklist] = await db
    .insert(schema.controlChecklists)
    .values(controlChecklistData)
    .returning();
  console.log("✓ Created control checklist");

  // Create campaigns
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
      channelPlanId: createdChannelPlan.id,
      fulfillmentPlanId: createdFulfillmentPlan.id,
      controlChecklistId: createdControlChecklist.id,
    })
    .returning();

  // Link offers to campaign 1 (Amazon, Target, Starbucks)
  await db.insert(schema.campaignOffers).values([
    { campaignId: campaign1.id, offerId: createdOffers[0].id }, // Amazon 3× Points
    { campaignId: campaign1.id, offerId: createdOffers[1].id }, // Target 5% Weekend
    { campaignId: campaign1.id, offerId: createdOffers[2].id }, // Starbucks Bonus
  ]);

  // Link segments to campaign 1
  await db.insert(schema.campaignSegments).values([
    { campaignId: campaign1.id, segmentId: createdSegments[0].id }, // Holiday High Spenders
    { campaignId: campaign1.id, segmentId: createdSegments[1].id }, // Amazon Enthusiasts
  ]);

  // Link eligibility rules to campaign 1
  await db.insert(schema.campaignEligibilityRules).values([
    { campaignId: campaign1.id, eligibilityRuleId: createdRules[0].id },
  ]);

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
      channelPlanId: createdChannelPlan.id,
      fulfillmentPlanId: createdFulfillmentPlan.id,
      controlChecklistId: createdControlChecklist.id,
    })
    .returning();

  // Link offers to campaign 2 (Travel Miles Accelerator, Dining Cashback)
  await db.insert(schema.campaignOffers).values([
    { campaignId: campaign2.id, offerId: createdOffers[4].id }, // Travel Miles Accelerator
    { campaignId: campaign2.id, offerId: createdOffers[5].id }, // Dining Cashback
  ]);

  // Link segments to campaign 2
  await db.insert(schema.campaignSegments).values([
    { campaignId: campaign2.id, segmentId: createdSegments[2].id }, // Travel Frequent Flyers
  ]);

  // Link eligibility rules to campaign 2
  await db.insert(schema.campaignEligibilityRules).values([
    { campaignId: campaign2.id, eligibilityRuleId: createdRules[0].id },
    { campaignId: campaign2.id, eligibilityRuleId: createdRules[1].id },
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
      purpose: "Summer promotional campaign with focus on groceries, gas, and fitness rewards",
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
      channelPlanId: createdChannelPlan.id,
      fulfillmentPlanId: createdFulfillmentPlan.id,
      controlChecklistId: createdControlChecklist.id,
    })
    .returning();

  // Link offers to campaign 3 (Recurring Groceries, Gas Station, Fitness)
  await db.insert(schema.campaignOffers).values([
    { campaignId: campaign3.id, offerId: createdOffers[3].id }, // Recurring Groceries Booster
    { campaignId: campaign3.id, offerId: createdOffers[6].id }, // Gas Station Rewards
    { campaignId: campaign3.id, offerId: createdOffers[7].id }, // Fitness Membership Discount
  ]);

  // Link segments to campaign 3
  await db.insert(schema.campaignSegments).values([
    { campaignId: campaign3.id, segmentId: createdSegments[0].id }, // Holiday High Spenders
  ]);

  // Link eligibility rules to campaign 3
  await db.insert(schema.campaignEligibilityRules).values([
    { campaignId: campaign3.id, eligibilityRuleId: createdRules[0].id },
  ]);

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

  // Create some audit log entries
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
      payload: { checklistId: createdControlChecklist.id },
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

  // Create a simulation run for campaign 2
  console.log("Creating simulation run...");
  await db.insert(schema.simulationRuns).values({
    campaignId: campaign2.id,
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
      { key: "data-availability", label: "Data Availability Check", status: "DONE" },
      { key: "channel-mock", label: "Channel Distribution Mock", status: "DONE" },
      { key: "presentment", label: "Offer Presentment Simulation", status: "DONE" },
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

  console.log("✓ Created simulation run");

  console.log("\n✅ Database seed completed successfully!");
  console.log("\nSummary:");
  console.log(`- ${createdOffers.length} offers`);
  console.log(`- ${createdSegments.length} segments`);
  console.log(`- ${createdRules.length} eligibility rules`);
  console.log("- 3 campaigns (1 LIVE, 1 IN_REVIEW, 1 ENDED)");
  console.log("- 1 channel plan");
  console.log("- 1 fulfillment plan");
  console.log("- 1 control checklist");
  console.log("- 9 approvals");
  console.log("- 4 audit log entries");
  console.log("- 1 simulation run");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

