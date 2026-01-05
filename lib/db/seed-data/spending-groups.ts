/**
 * Seed spending groups with dynamic account assignment
 *
 * Assigns accounts to spending groups based on their tier and spending profile
 * to create realistic, cohesive groupings for the demo.
 */

import { db } from "../index";
import * as schema from "../schema";
import {
  assignAccountsToSpendingGroups,
  SPENDING_GROUP_CONFIGS,
  type SpendingProfile,
} from "./generators";
import type { AccountTier } from "../schema";

interface Account {
  id: string;
  tier: AccountTier;
  annualSpend: number;
  spendingProfile: SpendingProfile;
}

interface Segment {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
}

interface SeedSpendingGroupsDeps {
  accounts: Account[];
  segments: Segment[];
  campaigns: { campaign1: Campaign };
}

export interface CreatedSpendingGroup {
  id: string;
  name: string;
  description: string | null;
  criteria: Record<string, unknown> | null;
  accountCount: number;
  avgSpend: number;
}

/**
 * Seed spending groups, account links, segment links, and Spend Stim simulation
 */
export async function seedSpendingGroups(deps: SeedSpendingGroupsDeps) {
  const { accounts, segments, campaigns } = deps;

  console.log("Creating spending groups...");

  // Dynamically assign accounts to spending groups
  const groupAssignments = assignAccountsToSpendingGroups(accounts);

  // Create spending groups in database
  const spendingGroupsData = SPENDING_GROUP_CONFIGS.map((config) => {
    const assignments = groupAssignments.get(config.name) || [];
    const assignedAccounts = assignments.map((a) =>
      accounts.find((acc) => acc.id === a.accountId)!
    ).filter(Boolean);

    const totalSpend = assignedAccounts.reduce(
      (sum, acc) => sum + acc.annualSpend,
      0
    );
    const avgSpend =
      assignedAccounts.length > 0
        ? Math.round(totalSpend / assignedAccounts.length)
        : 0;

    return {
      name: config.name,
      description: config.description,
      criteria: {
        minAnnualSpend: config.minAnnualSpend,
        tiers: config.targetTiers,
        categories: config.categories,
      },
      accountCount: assignedAccounts.length,
      avgSpend,
    };
  });

  const createdSpendingGroups = await db
    .insert(schema.spendingGroups)
    .values(spendingGroupsData)
    .returning();

  console.log(`✓ Created ${createdSpendingGroups.length} spending groups`);

  // Link accounts to spending groups
  console.log("Linking accounts to spending groups...");

  const spendingGroupAccountsData: Array<{
    spendingGroupId: string;
    accountId: string;
    score: number;
  }> = [];

  for (const group of createdSpendingGroups) {
    const assignments = groupAssignments.get(group.name) || [];
    for (const assignment of assignments) {
      spendingGroupAccountsData.push({
        spendingGroupId: group.id,
        accountId: assignment.accountId,
        score: assignment.score,
      });
    }
  }

  if (spendingGroupAccountsData.length > 0) {
    await db.insert(schema.spendingGroupAccounts).values(spendingGroupAccountsData);
  }

  // Count unique accounts across all groups
  const uniqueAccountIds = new Set(spendingGroupAccountsData.map((d) => d.accountId));
  console.log(
    `✓ Linked ${uniqueAccountIds.size} unique accounts to spending groups (${spendingGroupAccountsData.length} total links)`
  );

  // Link segments to spending groups
  console.log("Linking segments to spending groups...");

  // Find spending group IDs by name
  const getGroupId = (name: string) =>
    createdSpendingGroups.find((g) => g.name === name)?.id;

  const segmentSpendingGroupsData: Array<{
    segmentId: string;
    spendingGroupId: string;
  }> = [];

  // Holiday High Spenders -> High Value Customers
  const highValueGroupId = getGroupId("High Value Customers");
  const holidaySegment = segments.find((s) => s.name === "Holiday High Spenders");
  if (highValueGroupId && holidaySegment) {
    segmentSpendingGroupsData.push({
      segmentId: holidaySegment.id,
      spendingGroupId: highValueGroupId,
    });
  }

  // Amazon Enthusiasts -> Online Shoppers
  const onlineGroupId = getGroupId("Online Shoppers");
  const amazonSegment = segments.find((s) => s.name === "Amazon Enthusiasts");
  if (onlineGroupId && amazonSegment) {
    segmentSpendingGroupsData.push({
      segmentId: amazonSegment.id,
      spendingGroupId: onlineGroupId,
    });
  }

  // Travel Frequent Flyers -> Premium Travelers
  const travelGroupId = getGroupId("Premium Travelers");
  const travelSegment = segments.find((s) => s.name === "Travel Frequent Flyers");
  if (travelGroupId && travelSegment) {
    segmentSpendingGroupsData.push({
      segmentId: travelSegment.id,
      spendingGroupId: travelGroupId,
    });
  }

  if (segmentSpendingGroupsData.length > 0) {
    await db.insert(schema.segmentSpendingGroups).values(segmentSpendingGroupsData);
  }
  console.log(`✓ Linked segments to spending groups`);

  // Create Spend Stim simulation run for campaign 1 (Holiday Rewards Blitz)
  // Get accounts in High Value Customers group for the simulation preview
  const highValueAssignments = groupAssignments.get("High Value Customers") || [];
  const highValueAccounts = highValueAssignments
    .slice(0, 10) // Top 10 by score
    .map((a) => accounts.find((acc) => acc.id === a.accountId)!)
    .filter(Boolean);

  // Calculate realistic projections based on actual account data
  const totalCurrentSpend = highValueAccounts.reduce(
    (sum, acc) => sum + Math.round(acc.annualSpend / 12),
    0
  );
  const avgLiftPct = 22.5; // Target 22.5% average lift
  const totalProjectedSpend = Math.round(totalCurrentSpend * (1 + avgLiftPct / 100));
  const projectedRevenue = totalProjectedSpend - totalCurrentSpend;

  // Generate per-account projections
  const accountProjections = highValueAccounts.map((account) => {
    const currentMonthlySpend = Math.round(account.annualSpend / 12);
    const tierLiftBonus =
      account.tier === "DIAMOND" ? 5 : account.tier === "PLATINUM" ? 3 : 0;
    const liftPct = avgLiftPct + tierLiftBonus + (Math.random() * 5 - 2.5);
    const projectedLift = Math.round(currentMonthlySpend * (liftPct / 100));
    const projectedMonthlySpend = currentMonthlySpend + projectedLift;

    // Generate category breakdown based on spending profile
    const categoryBreakdown: Record<string, number> = {};
    const categories = account.spendingProfile.primaryCategories;
    const remainingSpend = currentMonthlySpend;
    let allocated = 0;

    categories.forEach((cat, idx) => {
      if (idx === categories.length - 1) {
        categoryBreakdown[cat] = remainingSpend - allocated;
      } else {
        const share = Math.round(
          remainingSpend * (0.4 - idx * 0.1) * (0.8 + Math.random() * 0.4)
        );
        categoryBreakdown[cat] = share;
        allocated += share;
      }
    });

    return {
      accountId: account.id,
      accountName: `Account ${account.id.slice(-8)}`, // Will be updated with real names
      tier: account.tier,
      currentMonthlySpend,
      projectedMonthlySpend,
      projectedLift,
      projectedLiftPct: Math.round(liftPct * 10) / 10,
      categoryBreakdown,
      confidence: "HIGH" as const, // With 30-50 transactions, all should be HIGH
    };
  });

  await db.insert(schema.simulationRuns).values({
    campaignId: campaigns.campaign1.id,
    simulationType: "SPEND_STIM",
    spendingGroupId: highValueGroupId || null,
    inputs: {
      analysisWindow: "90 days",
      projectionPeriod: "30 days",
      liftModel: "tier-based",
    },
    cohortSize: highValueAccounts.length,
    projections: {
      totalCurrentSpend,
      totalProjectedSpend,
      avgLiftPct: Math.round(avgLiftPct * 10) / 10,
      revenue: projectedRevenue,
      accountProjections,
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
    groupAssignments,
  };
}
