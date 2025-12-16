import { db } from "../index";
import * as schema from "../schema";

type Account = { id: string };
type Segment = { id: string };
type Campaign = { id: string };

interface SeedSpendingGroupsDeps {
  accounts: Account[];
  segments: Segment[];
  campaigns: { campaign1: Campaign };
}

/**
 * Seed spending groups, account links, segment links, and Spend Stim simulation
 */
export async function seedSpendingGroups(deps: SeedSpendingGroupsDeps) {
  const { accounts, segments, campaigns } = deps;

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

  // Link accounts to spending groups
  console.log("Linking accounts to spending groups...");
  const spendingGroupAccountsData = [
    // Premium Travelers - DIAMOND and PLATINUM high spenders (15 accounts)
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[0].id, score: 100 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[1].id, score: 95 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[2].id, score: 90 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[3].id, score: 88 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[4].id, score: 85 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[5].id, score: 80 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[6].id, score: 75 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[7].id, score: 70 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[8].id, score: 65 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[9].id, score: 60 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[10].id, score: 55 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[11].id, score: 50 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[12].id, score: 45 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[13].id, score: 40 },
    { spendingGroupId: createdSpendingGroups[0].id, accountId: accounts[14].id, score: 35 },

    // Everyday Essentials - mix of tiers, groceries focus (14 accounts)
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[9].id, score: 95 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[10].id, score: 90 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[11].id, score: 85 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[12].id, score: 80 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[13].id, score: 75 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[14].id, score: 70 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[15].id, score: 65 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[16].id, score: 60 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[17].id, score: 55 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[18].id, score: 50 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[6].id, score: 45 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[7].id, score: 40 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[4].id, score: 35 },
    { spendingGroupId: createdSpendingGroups[1].id, accountId: accounts[5].id, score: 30 },

    // Online Shoppers - Amazon heavy users (12 accounts)
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[3].id, score: 95 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[7].id, score: 90 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[8].id, score: 85 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[13].id, score: 80 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[17].id, score: 75 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[18].id, score: 70 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[15].id, score: 65 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[16].id, score: 60 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[11].id, score: 55 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[12].id, score: 50 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[1].id, score: 45 },
    { spendingGroupId: createdSpendingGroups[2].id, accountId: accounts[2].id, score: 40 },

    // Dining Enthusiasts - restaurant spenders (13 accounts)
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[1].id, score: 95 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[4].id, score: 90 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[6].id, score: 85 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[10].id, score: 80 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[12].id, score: 75 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[16].id, score: 70 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[0].id, score: 65 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[8].id, score: 60 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[9].id, score: 55 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[11].id, score: 50 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[13].id, score: 45 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[15].id, score: 40 },
    { spendingGroupId: createdSpendingGroups[3].id, accountId: accounts[17].id, score: 35 },

    // High Value Customers - top spenders only (8 accounts)
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[0].id, score: 100 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[1].id, score: 95 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[2].id, score: 90 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[3].id, score: 88 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[4].id, score: 85 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[5].id, score: 80 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[6].id, score: 75 },
    { spendingGroupId: createdSpendingGroups[4].id, accountId: accounts[7].id, score: 70 },
  ];

  await db.insert(schema.spendingGroupAccounts).values(spendingGroupAccountsData);
  console.log(`✓ Linked accounts to spending groups`);

  // Link segments to spending groups
  console.log("Linking segments to spending groups...");
  const segmentSpendingGroupsData = [
    // Holiday High Spenders -> High Value Customers
    { segmentId: segments[0].id, spendingGroupId: createdSpendingGroups[4].id },
    // Amazon Enthusiasts -> Online Shoppers
    { segmentId: segments[1].id, spendingGroupId: createdSpendingGroups[2].id },
    // Travel Frequent Flyers -> Premium Travelers
    { segmentId: segments[2].id, spendingGroupId: createdSpendingGroups[0].id },
  ];

  await db.insert(schema.segmentSpendingGroups).values(segmentSpendingGroupsData);
  console.log(`✓ Linked segments to spending groups`);

  // Create Spend Stim simulation run for campaign 1 (Holiday Rewards Blitz)
  await db.insert(schema.simulationRuns).values({
    campaignId: campaigns.campaign1.id,
    simulationType: "SPEND_STIM",
    spendingGroupId: createdSpendingGroups[4].id, // High Value Customers
    inputs: {
      analysisWindow: "90 days",
      projectionPeriod: "30 days",
      liftModel: "tier-based",
    },
    cohortSize: 8, // 8 accounts in High Value Customers
    projections: {
      totalCurrentSpend: 8500000, // $85,000 current monthly spend
      totalProjectedSpend: 10200000, // $102,000 projected monthly spend
      avgLiftPct: 20.0,
      revenue: 1700000, // $17,000 projected revenue lift
      accountProjections: [
        {
          accountId: accounts[0].id,
          accountName: "Victoria Sterling",
          tier: "DIAMOND" as const,
          currentMonthlySpend: 1250000,
          projectedMonthlySpend: 1562500,
          projectedLift: 312500,
          projectedLiftPct: 25.0,
          categoryBreakdown: {
            "Online Shopping": 450000,
            Travel: 380000,
            Dining: 220000,
            Groceries: 200000,
          },
          confidence: "HIGH" as const,
        },
        {
          accountId: accounts[1].id,
          accountName: "Alexander Chen",
          tier: "DIAMOND" as const,
          currentMonthlySpend: 1041667,
          projectedMonthlySpend: 1302083,
          projectedLift: 260416,
          projectedLiftPct: 25.0,
          categoryBreakdown: {
            Travel: 420000,
            "Online Shopping": 350000,
            Dining: 180000,
            Groceries: 91667,
          },
          confidence: "HIGH" as const,
        },
        {
          accountId: accounts[2].id,
          accountName: "Isabella Rodriguez",
          tier: "DIAMOND" as const,
          currentMonthlySpend: 916667,
          projectedMonthlySpend: 1145833,
          projectedLift: 229166,
          projectedLiftPct: 25.0,
          categoryBreakdown: {
            "Online Shopping": 380000,
            Dining: 280000,
            Groceries: 156667,
            Travel: 100000,
          },
          confidence: "HIGH" as const,
        },
        {
          accountId: accounts[3].id,
          accountName: "William Park",
          tier: "DIAMOND" as const,
          currentMonthlySpend: 791667,
          projectedMonthlySpend: 989583,
          projectedLift: 197916,
          projectedLiftPct: 25.0,
          categoryBreakdown: {
            "Online Shopping": 420000,
            Electronics: 200000,
            Dining: 120000,
            Groceries: 51667,
          },
          confidence: "HIGH" as const,
        },
        {
          accountId: accounts[4].id,
          accountName: "Sophia Williams",
          tier: "PLATINUM" as const,
          currentMonthlySpend: 625000,
          projectedMonthlySpend: 750000,
          projectedLift: 125000,
          projectedLiftPct: 20.0,
          categoryBreakdown: {
            Retail: 280000,
            Dining: 180000,
            Groceries: 100000,
            Travel: 65000,
          },
          confidence: "MEDIUM" as const,
        },
        {
          accountId: accounts[5].id,
          accountName: "James Thompson",
          tier: "PLATINUM" as const,
          currentMonthlySpend: 516667,
          projectedMonthlySpend: 620000,
          projectedLift: 103333,
          projectedLiftPct: 20.0,
          categoryBreakdown: {
            Dining: 220000,
            "Online Shopping": 150000,
            Groceries: 96667,
            "Gas Stations": 50000,
          },
          confidence: "MEDIUM" as const,
        },
        {
          accountId: accounts[6].id,
          accountName: "Emma Davis",
          tier: "PLATINUM" as const,
          currentMonthlySpend: 483333,
          projectedMonthlySpend: 580000,
          projectedLift: 96667,
          projectedLiftPct: 20.0,
          categoryBreakdown: {
            Groceries: 180000,
            Dining: 150000,
            Retail: 103333,
            "Online Shopping": 50000,
          },
          confidence: "MEDIUM" as const,
        },
        {
          accountId: accounts[7].id,
          accountName: "Daniel Martinez",
          tier: "PLATINUM" as const,
          currentMonthlySpend: 375000,
          projectedMonthlySpend: 450000,
          projectedLift: 75000,
          projectedLiftPct: 20.0,
          categoryBreakdown: {
            "Online Shopping": 180000,
            Groceries: 95000,
            Dining: 60000,
            "Gas Stations": 40000,
          },
          confidence: "MEDIUM" as const,
        },
      ],
    },
    steps: [
      { key: "fetch-accounts", label: "Fetch Spending Group Accounts", status: "DONE" },
      { key: "load-transactions", label: "Load Transaction History", status: "DONE" },
      { key: "analyze-patterns", label: "Analyze Spending Patterns", status: "DONE" },
      { key: "calculate-projections", label: "Calculate Projections", status: "DONE" },
      { key: "aggregate-results", label: "Aggregate Results", status: "DONE" },
    ],
    finished: true,
    success: true,
    errors: [],
    startedAt: new Date("2025-11-20T14:30:00Z"),
    finishedAt: new Date("2025-11-20T14:31:45Z"),
  });
  console.log("✓ Created Spend Stim simulation run");

  return {
    spendingGroups: createdSpendingGroups,
    spendingGroupAccountsData,
  };
}

