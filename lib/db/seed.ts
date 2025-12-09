import { db } from "./index";
import * as schema from "./schema";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  console.log("Clearing existing data...");

  // Clear account-level data first (in reverse order of dependencies)
  await db.delete(schema.accountTransactions);
  await db.delete(schema.accountOfferEnrollments);
  await db.delete(schema.accountCreditCards);
  await db.delete(schema.creditCards);
  await db.delete(schema.spendingGroupAccounts);
  await db.delete(schema.segmentSpendingGroups);
  await db.delete(schema.spendingGroups);
  await db.delete(schema.accounts);

  // Clear campaign data
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
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 100000, // $1000 in cents
        vendor: "Amazon",
        timeframeDays: 90,
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
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 50000, // $500 in cents
        vendor: "Target",
        timeframeDays: 60,
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
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 5000, // $50 in cents
        vendor: "Starbucks",
        timeframeDays: 30,
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
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 30000, // $300 in cents per month
        category: "Groceries",
        timeframeDays: 30,
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
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 200000, // $2000 in cents
        category: "Travel",
        timeframeDays: 120,
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
      hasProgressTracking: false,
      progressTarget: null,
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
      hasProgressTracking: false,
      progressTarget: null,
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
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 25000, // $250 in cents
        vendor: "Nike",
        timeframeDays: 60,
      },
    },
  ];

  const createdOffers = await db
    .insert(schema.offers)
    .values(offersData)
    .returning();
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

  const createdSegments = await db
    .insert(schema.segments)
    .values(segmentsData)
    .returning();
  console.log(`✓ Created ${createdSegments.length} segments`);

  // Create eligibility rules
  console.log("Creating eligibility rules...");
  const rulesData = [
    {
      dsl: "(account.status == 'ACTIVE') AND (account.delinquency_days < 30) AND (credit_score >= 650)",
      dataDependencies: [
        "account.status",
        "account.delinquency_days",
        "credit_score",
      ],
    },
    {
      dsl: "(account.tenure_months >= 6) AND (account.avg_monthly_spend >= 500) AND (opt_in.marketing == true)",
      dataDependencies: [
        "account.tenure_months",
        "account.avg_monthly_spend",
        "opt_in.marketing",
      ],
    },
  ];

  const createdRules = await db
    .insert(schema.eligibilityRules)
    .values(rulesData)
    .returning();
  console.log(`✓ Created ${createdRules.length} eligibility rules`);

  // Create channel plan
  console.log("Creating channel plan...");
  const channelPlanData = {
    channels: ["EMAIL", "MOBILE", "WEB"],
    creatives: [
      {
        channel: "EMAIL",
        preview:
          "Holiday rewards are here! Earn 3× points on your favorite brands.",
      },
      {
        channel: "MOBILE",
        preview:
          "🎁 Special Holiday Offer: Triple points on Amazon, Target & more!",
      },
      {
        channel: "WEB",
        preview: "Banner: Exclusive Holiday Rewards - Limited Time Only",
      },
    ],
    dynamicTnc:
      "Offer valid through 12/31/2025. Points earned will post within 2 billing cycles. See full terms at example.com/terms.",
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
  await db
    .insert(schema.campaignEligibilityRules)
    .values([
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
  await db
    .insert(schema.campaignEligibilityRules)
    .values([
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

  console.log("✓ Created simulation run");

  // ==========================================
  // ACCOUNT-LEVEL DATA
  // ==========================================

  // Create mock accounts (20 accounts)
  console.log("Creating accounts...");
  const accountsData = [
    // DIAMOND tier (4 accounts)
    {
      accountNumber: "ACCT-001-DIAMOND",
      firstName: "Victoria",
      lastName: "Sterling",
      email: "victoria.sterling@email.com",
      tier: "DIAMOND" as const,
      status: "ACTIVE" as const,
      creditLimit: 5000000, // $50,000
      currentBalance: 1250000, // $12,500
      annualSpend: 15000000, // $150,000
      memberSince: new Date("2018-03-15"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    {
      accountNumber: "ACCT-002-DIAMOND",
      firstName: "Alexander",
      lastName: "Chen",
      email: "alex.chen@email.com",
      tier: "DIAMOND" as const,
      status: "ACTIVE" as const,
      creditLimit: 4500000, // $45,000
      currentBalance: 890000, // $8,900
      annualSpend: 12500000, // $125,000
      memberSince: new Date("2019-01-10"),
      metadata: { preferredChannel: "MOBILE", language: "en" },
    },
    {
      accountNumber: "ACCT-003-DIAMOND",
      firstName: "Isabella",
      lastName: "Rodriguez",
      email: "isabella.r@email.com",
      tier: "DIAMOND" as const,
      status: "ACTIVE" as const,
      creditLimit: 4000000, // $40,000
      currentBalance: 2100000, // $21,000
      annualSpend: 11000000, // $110,000
      memberSince: new Date("2017-06-22"),
      metadata: { preferredChannel: "EMAIL", language: "es" },
    },
    {
      accountNumber: "ACCT-004-DIAMOND",
      firstName: "William",
      lastName: "Park",
      email: "will.park@email.com",
      tier: "DIAMOND" as const,
      status: "ACTIVE" as const,
      creditLimit: 3500000, // $35,000
      currentBalance: 450000, // $4,500
      annualSpend: 9500000, // $95,000
      memberSince: new Date("2020-02-28"),
      metadata: { preferredChannel: "WEB", language: "en" },
    },
    // PLATINUM tier (5 accounts)
    {
      accountNumber: "ACCT-005-PLATINUM",
      firstName: "Sophia",
      lastName: "Williams",
      email: "sophia.w@email.com",
      tier: "PLATINUM" as const,
      status: "ACTIVE" as const,
      creditLimit: 2500000, // $25,000
      currentBalance: 780000, // $7,800
      annualSpend: 7500000, // $75,000
      memberSince: new Date("2020-08-14"),
      metadata: { preferredChannel: "MOBILE", language: "en" },
    },
    {
      accountNumber: "ACCT-006-PLATINUM",
      firstName: "James",
      lastName: "Thompson",
      email: "james.t@email.com",
      tier: "PLATINUM" as const,
      status: "ACTIVE" as const,
      creditLimit: 2200000, // $22,000
      currentBalance: 560000, // $5,600
      annualSpend: 6200000, // $62,000
      memberSince: new Date("2021-03-05"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    {
      accountNumber: "ACCT-007-PLATINUM",
      firstName: "Emma",
      lastName: "Davis",
      email: "emma.davis@email.com",
      tier: "PLATINUM" as const,
      status: "ACTIVE" as const,
      creditLimit: 2000000, // $20,000
      currentBalance: 920000, // $9,200
      annualSpend: 5800000, // $58,000
      memberSince: new Date("2019-11-20"),
      metadata: { preferredChannel: "WEB", language: "en" },
    },
    {
      accountNumber: "ACCT-008-PLATINUM",
      firstName: "Daniel",
      lastName: "Martinez",
      email: "daniel.m@email.com",
      tier: "PLATINUM" as const,
      status: "ACTIVE" as const,
      creditLimit: 1800000, // $18,000
      currentBalance: 340000, // $3,400
      annualSpend: 4500000, // $45,000
      memberSince: new Date("2022-01-15"),
      metadata: { preferredChannel: "MOBILE", language: "es" },
    },
    {
      accountNumber: "ACCT-009-PLATINUM",
      firstName: "Olivia",
      lastName: "Anderson",
      email: "olivia.a@email.com",
      tier: "PLATINUM" as const,
      status: "ACTIVE" as const,
      creditLimit: 1500000, // $15,000
      currentBalance: 1100000, // $11,000
      annualSpend: 4200000, // $42,000
      memberSince: new Date("2021-07-08"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    // GOLD tier (6 accounts)
    {
      accountNumber: "ACCT-010-GOLD",
      firstName: "Michael",
      lastName: "Johnson",
      email: "michael.j@email.com",
      tier: "GOLD" as const,
      status: "ACTIVE" as const,
      creditLimit: 1200000, // $12,000
      currentBalance: 450000, // $4,500
      annualSpend: 3200000, // $32,000
      memberSince: new Date("2022-04-12"),
      metadata: { preferredChannel: "MOBILE", language: "en" },
    },
    {
      accountNumber: "ACCT-011-GOLD",
      firstName: "Ava",
      lastName: "Brown",
      email: "ava.brown@email.com",
      tier: "GOLD" as const,
      status: "ACTIVE" as const,
      creditLimit: 1000000, // $10,000
      currentBalance: 280000, // $2,800
      annualSpend: 2800000, // $28,000
      memberSince: new Date("2021-09-30"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    {
      accountNumber: "ACCT-012-GOLD",
      firstName: "Ethan",
      lastName: "Wilson",
      email: "ethan.w@email.com",
      tier: "GOLD" as const,
      status: "ACTIVE" as const,
      creditLimit: 900000, // $9,000
      currentBalance: 650000, // $6,500
      annualSpend: 2400000, // $24,000
      memberSince: new Date("2023-02-18"),
      metadata: { preferredChannel: "WEB", language: "en" },
    },
    {
      accountNumber: "ACCT-013-GOLD",
      firstName: "Mia",
      lastName: "Taylor",
      email: "mia.t@email.com",
      tier: "GOLD" as const,
      status: "ACTIVE" as const,
      creditLimit: 800000, // $8,000
      currentBalance: 190000, // $1,900
      annualSpend: 2100000, // $21,000
      memberSince: new Date("2022-11-05"),
      metadata: { preferredChannel: "MOBILE", language: "en" },
    },
    {
      accountNumber: "ACCT-014-GOLD",
      firstName: "Benjamin",
      lastName: "Moore",
      email: "ben.moore@email.com",
      tier: "GOLD" as const,
      status: "ACTIVE" as const,
      creditLimit: 750000, // $7,500
      currentBalance: 320000, // $3,200
      annualSpend: 1800000, // $18,000
      memberSince: new Date("2023-05-22"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    {
      accountNumber: "ACCT-015-GOLD",
      firstName: "Charlotte",
      lastName: "Garcia",
      email: "charlotte.g@email.com",
      tier: "GOLD" as const,
      status: "SUSPENDED" as const,
      creditLimit: 700000, // $7,000
      currentBalance: 680000, // $6,800
      annualSpend: 1500000, // $15,000
      memberSince: new Date("2021-12-01"),
      metadata: {
        preferredChannel: "MOBILE",
        suspensionReason: "payment_review",
      },
    },
    // STANDARD tier (5 accounts)
    {
      accountNumber: "ACCT-016-STANDARD",
      firstName: "Lucas",
      lastName: "Lee",
      email: "lucas.lee@email.com",
      tier: "STANDARD" as const,
      status: "ACTIVE" as const,
      creditLimit: 500000, // $5,000
      currentBalance: 120000, // $1,200
      annualSpend: 850000, // $8,500
      memberSince: new Date("2024-01-10"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    {
      accountNumber: "ACCT-017-STANDARD",
      firstName: "Amelia",
      lastName: "Harris",
      email: "amelia.h@email.com",
      tier: "STANDARD" as const,
      status: "ACTIVE" as const,
      creditLimit: 450000, // $4,500
      currentBalance: 85000, // $850
      annualSpend: 650000, // $6,500
      memberSince: new Date("2024-03-25"),
      metadata: { preferredChannel: "MOBILE", language: "en" },
    },
    {
      accountNumber: "ACCT-018-STANDARD",
      firstName: "Henry",
      lastName: "Clark",
      email: "henry.c@email.com",
      tier: "STANDARD" as const,
      status: "ACTIVE" as const,
      creditLimit: 400000, // $4,000
      currentBalance: 210000, // $2,100
      annualSpend: 480000, // $4,800
      memberSince: new Date("2024-06-15"),
      metadata: { preferredChannel: "WEB", language: "en" },
    },
    {
      accountNumber: "ACCT-019-STANDARD",
      firstName: "Harper",
      lastName: "Lewis",
      email: "harper.l@email.com",
      tier: "STANDARD" as const,
      status: "ACTIVE" as const,
      creditLimit: 350000, // $3,500
      currentBalance: 55000, // $550
      annualSpend: 320000, // $3,200
      memberSince: new Date("2024-08-01"),
      metadata: { preferredChannel: "EMAIL", language: "en" },
    },
    {
      accountNumber: "ACCT-020-STANDARD",
      firstName: "Sebastian",
      lastName: "Walker",
      email: "sebastian.w@email.com",
      tier: "STANDARD" as const,
      status: "CLOSED" as const,
      creditLimit: 300000, // $3,000
      currentBalance: 0,
      annualSpend: 200000, // $2,000
      memberSince: new Date("2023-09-10"),
      metadata: {
        preferredChannel: "MOBILE",
        closedReason: "customer_request",
      },
    },
  ];

  const createdAccounts = await db
    .insert(schema.accounts)
    .values(accountsData)
    .returning();
  console.log(`✓ Created ${createdAccounts.length} accounts`);

  // Create spending groups (5 groups)
  console.log("Creating spending groups...");
  const spendingGroupsData = [
    {
      name: "Premium Travelers",
      description:
        "High travel spend customers, primarily PLATINUM/DIAMOND tier members who travel frequently",
      criteria: {
        minAnnualSpend: 4000000, // $40,000
        tiers: ["PLATINUM" as const, "DIAMOND" as const],
        categories: ["Travel", "Airlines", "Hotels"],
      },
      accountCount: 15,
      avgSpend: 9500000, // $95,000
    },
    {
      name: "Everyday Essentials",
      description: "Customers focused on groceries and gas station spending",
      criteria: {
        minAnnualSpend: 500000, // $5,000
        categories: ["Groceries", "Gas Stations"],
        minTransactions: 20,
      },
      accountCount: 14,
      avgSpend: 2500000, // $25,000
    },
    {
      name: "Online Shoppers",
      description: "Heavy Amazon and online retail users",
      criteria: {
        categories: ["Online Shopping", "Amazon"],
        minTransactions: 15,
      },
      accountCount: 12,
      avgSpend: 3200000, // $32,000
    },
    {
      name: "Dining Enthusiasts",
      description: "Restaurant and dining focused spenders",
      criteria: {
        categories: ["Dining", "Restaurants", "Food Delivery"],
        minAnnualSpend: 300000, // $3,000
      },
      accountCount: 13,
      avgSpend: 1800000, // $18,000
    },
    {
      name: "High Value Customers",
      description: "Top 10% overall spend - most valuable customers",
      criteria: {
        minAnnualSpend: 7500000, // $75,000
        tiers: ["PLATINUM" as const, "DIAMOND" as const],
      },
      accountCount: 8,
      avgSpend: 11000000, // $110,000
    },
  ];

  const createdSpendingGroups = await db
    .insert(schema.spendingGroups)
    .values(spendingGroupsData)
    .returning();
  console.log(`✓ Created ${createdSpendingGroups.length} spending groups`);

  // Link accounts to spending groups (expanded to up to 15 per group)
  console.log("Linking accounts to spending groups...");
  const spendingGroupAccountsData = [
    // Premium Travelers - DIAMOND and PLATINUM high spenders (15 accounts)
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[0].id,
      score: 100,
    }, // Victoria
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[1].id,
      score: 95,
    }, // Alexander
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[2].id,
      score: 90,
    }, // Isabella
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[3].id,
      score: 88,
    }, // William
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[4].id,
      score: 85,
    }, // Sophia
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[5].id,
      score: 80,
    }, // James
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[6].id,
      score: 75,
    }, // Emma
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[7].id,
      score: 70,
    }, // Daniel
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[8].id,
      score: 65,
    }, // Olivia
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[9].id,
      score: 60,
    }, // Michael
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[10].id,
      score: 55,
    }, // Ava
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[11].id,
      score: 50,
    }, // Ethan
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[12].id,
      score: 45,
    }, // Mia
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[13].id,
      score: 40,
    }, // Benjamin
    {
      spendingGroupId: createdSpendingGroups[0].id,
      accountId: createdAccounts[14].id,
      score: 35,
    }, // Charlotte

    // Everyday Essentials - mix of tiers, groceries focus (14 accounts)
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[9].id,
      score: 95,
    }, // Michael
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[10].id,
      score: 90,
    }, // Ava
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[11].id,
      score: 85,
    }, // Ethan
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[12].id,
      score: 80,
    }, // Mia
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[13].id,
      score: 75,
    }, // Benjamin
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[14].id,
      score: 70,
    }, // Charlotte
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[15].id,
      score: 65,
    }, // Lucas
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[16].id,
      score: 60,
    }, // Amelia
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[17].id,
      score: 55,
    }, // Henry
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[18].id,
      score: 50,
    }, // Harper
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[6].id,
      score: 45,
    }, // Emma
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[7].id,
      score: 40,
    }, // Daniel
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[4].id,
      score: 35,
    }, // Sophia
    {
      spendingGroupId: createdSpendingGroups[1].id,
      accountId: createdAccounts[5].id,
      score: 30,
    }, // James

    // Online Shoppers - Amazon heavy users (12 accounts)
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[3].id,
      score: 95,
    }, // William
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[7].id,
      score: 90,
    }, // Daniel
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[8].id,
      score: 85,
    }, // Olivia
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[13].id,
      score: 80,
    }, // Benjamin
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[17].id,
      score: 75,
    }, // Henry
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[18].id,
      score: 70,
    }, // Harper
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[15].id,
      score: 65,
    }, // Lucas
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[16].id,
      score: 60,
    }, // Amelia
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[11].id,
      score: 55,
    }, // Ethan
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[12].id,
      score: 50,
    }, // Mia
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[1].id,
      score: 45,
    }, // Alexander
    {
      spendingGroupId: createdSpendingGroups[2].id,
      accountId: createdAccounts[2].id,
      score: 40,
    }, // Isabella

    // Dining Enthusiasts - restaurant spenders (13 accounts)
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[1].id,
      score: 95,
    }, // Alexander
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[4].id,
      score: 90,
    }, // Sophia
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[6].id,
      score: 85,
    }, // Emma
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[10].id,
      score: 80,
    }, // Ava
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[12].id,
      score: 75,
    }, // Mia
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[16].id,
      score: 70,
    }, // Amelia
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[0].id,
      score: 65,
    }, // Victoria
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[8].id,
      score: 60,
    }, // Olivia
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[9].id,
      score: 55,
    }, // Michael
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[11].id,
      score: 50,
    }, // Ethan
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[13].id,
      score: 45,
    }, // Benjamin
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[15].id,
      score: 40,
    }, // Lucas
    {
      spendingGroupId: createdSpendingGroups[3].id,
      accountId: createdAccounts[17].id,
      score: 35,
    }, // Henry

    // High Value Customers - top spenders only (8 accounts)
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[0].id,
      score: 100,
    }, // Victoria
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[1].id,
      score: 95,
    }, // Alexander
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[2].id,
      score: 90,
    }, // Isabella
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[3].id,
      score: 88,
    }, // William
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[4].id,
      score: 85,
    }, // Sophia
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[5].id,
      score: 80,
    }, // James
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[6].id,
      score: 75,
    }, // Emma
    {
      spendingGroupId: createdSpendingGroups[4].id,
      accountId: createdAccounts[7].id,
      score: 70,
    }, // Daniel
  ];

  await db
    .insert(schema.spendingGroupAccounts)
    .values(spendingGroupAccountsData);
  console.log(`✓ Linked accounts to spending groups`);

  // Link segments to spending groups
  console.log("Linking segments to spending groups...");
  const segmentSpendingGroupsData = [
    // Holiday High Spenders -> High Value Customers
    {
      segmentId: createdSegments[0].id,
      spendingGroupId: createdSpendingGroups[4].id,
    },
    // Amazon Enthusiasts -> Online Shoppers
    {
      segmentId: createdSegments[1].id,
      spendingGroupId: createdSpendingGroups[2].id,
    },
    // Travel Frequent Flyers -> Premium Travelers
    {
      segmentId: createdSegments[2].id,
      spendingGroupId: createdSpendingGroups[0].id,
    },
  ];

  await db
    .insert(schema.segmentSpendingGroups)
    .values(segmentSpendingGroupsData);
  console.log(`✓ Linked segments to spending groups`);

  // Create account offer enrollments with varying progress
  console.log("Creating account offer enrollments...");

  // Helper to calculate progress percentage
  // const calcProgressPct = (current: number, target: number) =>
  //   Math.min(100, Math.round((current / target) * 10000) / 100).toString();

  const enrollmentsData = [
    // Amazon 3× Points enrollments (offer 0) - target $1000
    {
      accountId: createdAccounts[0].id, // Victoria
      offerId: createdOffers[0].id,
      campaignId: campaign1.id,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-11-01"),
      expiresAt: new Date("2026-01-29"),
      targetAmount: 100000, // $1000
      currentProgress: 100000,
      progressPct: "100.00",
      completedAt: new Date("2025-11-28"),
      rewardEarned: 3000, // 3000 bonus points
    },
    {
      accountId: createdAccounts[1].id, // Alexander
      offerId: createdOffers[0].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-02"),
      expiresAt: new Date("2026-01-30"),
      targetAmount: 100000,
      currentProgress: 78500, // $785
      progressPct: "78.50",
      completedAt: null,
      rewardEarned: null,
    },
    {
      accountId: createdAccounts[3].id, // William
      offerId: createdOffers[0].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-05"),
      expiresAt: new Date("2026-02-02"),
      targetAmount: 100000,
      currentProgress: 45200, // $452
      progressPct: "45.20",
      completedAt: null,
      rewardEarned: null,
    },
    {
      accountId: createdAccounts[7].id, // Daniel
      offerId: createdOffers[0].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-10"),
      expiresAt: new Date("2026-02-07"),
      targetAmount: 100000,
      currentProgress: 12300, // $123 - just started
      progressPct: "12.30",
      completedAt: null,
      rewardEarned: null,
    },
    {
      accountId: createdAccounts[13].id, // Benjamin
      offerId: createdOffers[0].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-15"),
      expiresAt: new Date("2026-02-12"),
      targetAmount: 100000,
      currentProgress: 91500, // $915 - near completion
      progressPct: "91.50",
      completedAt: null,
      rewardEarned: null,
    },

    // Target 5% Weekend enrollments (offer 1) - target $500
    {
      accountId: createdAccounts[2].id, // Isabella
      offerId: createdOffers[1].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-01"),
      expiresAt: new Date("2025-12-31"),
      targetAmount: 50000,
      currentProgress: 32500, // $325
      progressPct: "65.00",
      completedAt: null,
      rewardEarned: null,
    },
    {
      accountId: createdAccounts[4].id, // Sophia
      offerId: createdOffers[1].id,
      campaignId: campaign1.id,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-11-03"),
      expiresAt: new Date("2026-01-01"),
      targetAmount: 50000,
      currentProgress: 50000,
      progressPct: "100.00",
      completedAt: new Date("2025-11-25"),
      rewardEarned: 2500, // $25 cashback
    },
    {
      accountId: createdAccounts[9].id, // Michael
      offerId: createdOffers[1].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-08"),
      expiresAt: new Date("2026-01-06"),
      targetAmount: 50000,
      currentProgress: 18700, // $187
      progressPct: "37.40",
      completedAt: null,
      rewardEarned: null,
    },

    // Starbucks Bonus enrollments (offer 2) - target $50
    {
      accountId: createdAccounts[5].id, // James
      offerId: createdOffers[2].id,
      campaignId: campaign1.id,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-11-01"),
      expiresAt: new Date("2025-12-01"),
      targetAmount: 5000,
      currentProgress: 5000,
      progressPct: "100.00",
      completedAt: new Date("2025-11-12"),
      rewardEarned: 500, // 500 bonus points
    },
    {
      accountId: createdAccounts[6].id, // Emma
      offerId: createdOffers[2].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-05"),
      expiresAt: new Date("2025-12-05"),
      targetAmount: 5000,
      currentProgress: 3200, // $32
      progressPct: "64.00",
      completedAt: null,
      rewardEarned: null,
    },
    {
      accountId: createdAccounts[10].id, // Ava
      offerId: createdOffers[2].id,
      campaignId: campaign1.id,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-11-10"),
      expiresAt: new Date("2025-12-10"),
      targetAmount: 5000,
      currentProgress: 1500, // $15
      progressPct: "30.00",
      completedAt: null,
      rewardEarned: null,
    },

    // Recurring Groceries enrollments (offer 3) - target $300/month
    {
      accountId: createdAccounts[9].id, // Michael
      offerId: createdOffers[3].id,
      campaignId: campaign3.id,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-06-01"),
      expiresAt: new Date("2025-08-31"),
      targetAmount: 30000,
      currentProgress: 30000,
      progressPct: "100.00",
      completedAt: new Date("2025-06-25"),
      rewardEarned: 600, // 2× points
    },
    {
      accountId: createdAccounts[10].id, // Ava
      offerId: createdOffers[3].id,
      campaignId: campaign3.id,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-06-01"),
      expiresAt: new Date("2025-08-31"),
      targetAmount: 30000,
      currentProgress: 30000,
      progressPct: "100.00",
      completedAt: new Date("2025-06-28"),
      rewardEarned: 600,
    },
    {
      accountId: createdAccounts[15].id, // Lucas
      offerId: createdOffers[3].id,
      campaignId: campaign3.id,
      status: "EXPIRED" as const,
      enrolledAt: new Date("2025-06-15"),
      expiresAt: new Date("2025-07-15"),
      targetAmount: 30000,
      currentProgress: 22000, // $220
      progressPct: "73.33",
      completedAt: null,
      rewardEarned: null,
    },

    // Travel Miles Accelerator enrollments (offer 4) - target $2000
    {
      accountId: createdAccounts[0].id, // Victoria
      offerId: createdOffers[4].id,
      campaignId: null, // Not from a campaign
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-09-01"),
      expiresAt: new Date("2025-12-29"),
      targetAmount: 200000,
      currentProgress: 156000, // $1,560
      progressPct: "78.00",
      completedAt: null,
      rewardEarned: null,
    },
    {
      accountId: createdAccounts[1].id, // Alexander
      offerId: createdOffers[4].id,
      campaignId: null,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-08-15"),
      expiresAt: new Date("2025-12-12"),
      targetAmount: 200000,
      currentProgress: 200000,
      progressPct: "100.00",
      completedAt: new Date("2025-11-20"),
      rewardEarned: 10000, // 10,000 bonus miles
    },
    {
      accountId: createdAccounts[4].id, // Sophia
      offerId: createdOffers[4].id,
      campaignId: null,
      status: "IN_PROGRESS" as const,
      enrolledAt: new Date("2025-10-01"),
      expiresAt: new Date("2026-01-28"),
      targetAmount: 200000,
      currentProgress: 85000, // $850
      progressPct: "42.50",
      completedAt: null,
      rewardEarned: null,
    },

    // Fitness Membership Discount enrollments (offer 7) - target $250
    {
      accountId: createdAccounts[5].id, // James
      offerId: createdOffers[7].id,
      campaignId: campaign3.id,
      status: "COMPLETED" as const,
      enrolledAt: new Date("2025-06-01"),
      expiresAt: new Date("2025-07-31"),
      targetAmount: 25000,
      currentProgress: 25000,
      progressPct: "100.00",
      completedAt: new Date("2025-07-15"),
      rewardEarned: 3750, // 15% discount
    },
    {
      accountId: createdAccounts[11].id, // Ethan
      offerId: createdOffers[7].id,
      campaignId: campaign3.id,
      status: "OPTED_OUT" as const,
      enrolledAt: new Date("2025-06-05"),
      expiresAt: new Date("2025-08-03"),
      targetAmount: 25000,
      currentProgress: 5000, // $50
      progressPct: "20.00",
      completedAt: null,
      rewardEarned: null,
    },
  ];

  const createdEnrollments = await db
    .insert(schema.accountOfferEnrollments)
    .values(enrollmentsData)
    .returning();
  console.log(`✓ Created ${createdEnrollments.length} offer enrollments`);

  // Create sample transactions
  console.log("Creating account transactions...");

  const transactionsData = [
    // Victoria's Amazon transactions (enrollment 0 - completed)
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[0].id,
      transactionDate: new Date("2025-11-05"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 15000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[0].id,
      transactionDate: new Date("2025-11-10"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 28500,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[0].id,
      transactionDate: new Date("2025-11-15"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 22000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[0].id,
      transactionDate: new Date("2025-11-20"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 19500,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[0].id,
      transactionDate: new Date("2025-11-28"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 15000,
      qualifiesForOffer: true,
    },

    // Alexander's Amazon transactions (enrollment 1 - in progress)
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[1].id,
      transactionDate: new Date("2025-11-08"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 32000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[1].id,
      transactionDate: new Date("2025-11-18"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 25500,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[1].id,
      transactionDate: new Date("2025-11-25"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 21000,
      qualifiesForOffer: true,
    },

    // William's Amazon transactions (enrollment 2)
    {
      accountId: createdAccounts[3].id,
      enrollmentId: createdEnrollments[2].id,
      transactionDate: new Date("2025-11-12"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 18200,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[3].id,
      enrollmentId: createdEnrollments[2].id,
      transactionDate: new Date("2025-11-22"),
      merchant: "Amazon",
      category: "Online Shopping",
      amount: 27000,
      qualifiesForOffer: true,
    },

    // Isabella's Target transactions (enrollment 5)
    {
      accountId: createdAccounts[2].id,
      enrollmentId: createdEnrollments[5].id,
      transactionDate: new Date("2025-11-04"),
      merchant: "Target",
      category: "Retail",
      amount: 8500,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[2].id,
      enrollmentId: createdEnrollments[5].id,
      transactionDate: new Date("2025-11-11"),
      merchant: "Target",
      category: "Retail",
      amount: 12000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[2].id,
      enrollmentId: createdEnrollments[5].id,
      transactionDate: new Date("2025-11-18"),
      merchant: "Target",
      category: "Retail",
      amount: 12000,
      qualifiesForOffer: true,
    },

    // Sophia's Target transactions (enrollment 6 - completed)
    {
      accountId: createdAccounts[4].id,
      enrollmentId: createdEnrollments[6].id,
      transactionDate: new Date("2025-11-09"),
      merchant: "Target",
      category: "Retail",
      amount: 18000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[4].id,
      enrollmentId: createdEnrollments[6].id,
      transactionDate: new Date("2025-11-16"),
      merchant: "Target",
      category: "Retail",
      amount: 15500,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[4].id,
      enrollmentId: createdEnrollments[6].id,
      transactionDate: new Date("2025-11-25"),
      merchant: "Target",
      category: "Retail",
      amount: 16500,
      qualifiesForOffer: true,
    },

    // James's Starbucks transactions (enrollment 8 - completed)
    {
      accountId: createdAccounts[5].id,
      enrollmentId: createdEnrollments[8].id,
      transactionDate: new Date("2025-11-03"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 850,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[5].id,
      enrollmentId: createdEnrollments[8].id,
      transactionDate: new Date("2025-11-05"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 720,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[5].id,
      enrollmentId: createdEnrollments[8].id,
      transactionDate: new Date("2025-11-08"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 980,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[5].id,
      enrollmentId: createdEnrollments[8].id,
      transactionDate: new Date("2025-11-10"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1250,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[5].id,
      enrollmentId: createdEnrollments[8].id,
      transactionDate: new Date("2025-11-12"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1200,
      qualifiesForOffer: true,
    },

    // Emma's Starbucks transactions (enrollment 9)
    {
      accountId: createdAccounts[6].id,
      enrollmentId: createdEnrollments[9].id,
      transactionDate: new Date("2025-11-07"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 650,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[6].id,
      enrollmentId: createdEnrollments[9].id,
      transactionDate: new Date("2025-11-14"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1100,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[6].id,
      enrollmentId: createdEnrollments[9].id,
      transactionDate: new Date("2025-11-21"),
      merchant: "Starbucks",
      category: "Dining",
      amount: 1450,
      qualifiesForOffer: true,
    },

    // Victoria's Travel transactions (enrollment 14)
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[14].id,
      transactionDate: new Date("2025-09-15"),
      merchant: "Delta Airlines",
      category: "Travel",
      amount: 45000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[14].id,
      transactionDate: new Date("2025-10-05"),
      merchant: "Marriott Hotels",
      category: "Travel",
      amount: 38000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[14].id,
      transactionDate: new Date("2025-10-20"),
      merchant: "United Airlines",
      category: "Travel",
      amount: 52000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: createdEnrollments[14].id,
      transactionDate: new Date("2025-11-10"),
      merchant: "Hilton",
      category: "Travel",
      amount: 21000,
      qualifiesForOffer: true,
    },

    // Alexander's Travel transactions (enrollment 15 - completed)
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[15].id,
      transactionDate: new Date("2025-08-20"),
      merchant: "American Airlines",
      category: "Travel",
      amount: 65000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[15].id,
      transactionDate: new Date("2025-09-10"),
      merchant: "Hyatt Hotels",
      category: "Travel",
      amount: 42000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[15].id,
      transactionDate: new Date("2025-10-15"),
      merchant: "Southwest Airlines",
      category: "Travel",
      amount: 35000,
      qualifiesForOffer: true,
    },
    {
      accountId: createdAccounts[1].id,
      enrollmentId: createdEnrollments[15].id,
      transactionDate: new Date("2025-11-05"),
      merchant: "Four Seasons",
      category: "Travel",
      amount: 58000,
      qualifiesForOffer: true,
    },

    // Non-qualifying transactions (general spending)
    {
      accountId: createdAccounts[0].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-02"),
      merchant: "Whole Foods",
      category: "Groceries",
      amount: 15600,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[0].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-08"),
      merchant: "Shell Gas",
      category: "Gas Stations",
      amount: 6500,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[1].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-12"),
      merchant: "Trader Joe's",
      category: "Groceries",
      amount: 9800,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[2].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-06"),
      merchant: "Costco",
      category: "Groceries",
      amount: 28500,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[3].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-15"),
      merchant: "Best Buy",
      category: "Electronics",
      amount: 125000,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[4].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-20"),
      merchant: "Nordstrom",
      category: "Retail",
      amount: 34500,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[5].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-18"),
      merchant: "Apple Store",
      category: "Electronics",
      amount: 129900,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[6].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-22"),
      merchant: "Cheesecake Factory",
      category: "Dining",
      amount: 8500,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[9].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-10"),
      merchant: "Safeway",
      category: "Groceries",
      amount: 12300,
      qualifiesForOffer: false,
    },
    {
      accountId: createdAccounts[10].id,
      enrollmentId: null,
      transactionDate: new Date("2025-11-14"),
      merchant: "CVS",
      category: "Pharmacy",
      amount: 4500,
      qualifiesForOffer: false,
    },
  ];

  await db.insert(schema.accountTransactions).values(transactionsData);
  console.log(`✓ Created ${transactionsData.length} transactions`);

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
  console.log(`- ${createdAccounts.length} accounts`);
  console.log(`- ${createdSpendingGroups.length} spending groups`);
  console.log(`- ${spendingGroupAccountsData.length} account-group links`);
  console.log(`- ${createdEnrollments.length} offer enrollments`);
  console.log(`- ${transactionsData.length} transactions`);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
