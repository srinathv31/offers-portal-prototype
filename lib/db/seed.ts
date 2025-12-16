/**
 * Database Seed Orchestrator
 *
 * This file orchestrates all seed-data modules to populate the database
 * with mock data for development and demo purposes.
 */

import { db } from "./index";
import * as schema from "./schema";

// Import all seed-data modules
import { seedOffers } from "./seed-data/offers";
import { seedSegments } from "./seed-data/segments";
import { seedEligibilityRules } from "./seed-data/eligibility-rules";
import { seedPlans } from "./seed-data/plans";
import { seedCampaigns } from "./seed-data/campaigns";
import { seedAccounts } from "./seed-data/accounts";
import { seedCreditCards } from "./seed-data/credit-cards";
import { seedSpendingGroups } from "./seed-data/spending-groups";
import { seedEnrollments } from "./seed-data/enrollments";
import { seedTransactions } from "./seed-data/transactions";

/**
 * Clear all existing data from the database
 * Order matters - clear child tables before parent tables
 */
async function clearDatabase() {
  console.log("Clearing existing data...");

  // Clear account-level data first (in reverse order of dependencies)
  await db.delete(schema.accountTransactions);
  await db.delete(schema.accountOfferEnrollments);
  await db.delete(schema.accountCreditCards);
  await db.delete(schema.creditCards);

  // Clear campaign data (before spending groups since simulation_runs references spending_groups)
  await db.delete(schema.auditLogs);
  await db.delete(schema.simulationRuns);
  await db.delete(schema.approvals);
  await db.delete(schema.campaignEligibilityRules);
  await db.delete(schema.campaignSegments);
  await db.delete(schema.campaignOffers);
  await db.delete(schema.campaigns);

  // Clear spending groups (after simulation_runs which references them)
  await db.delete(schema.spendingGroupAccounts);
  await db.delete(schema.segmentSpendingGroups);
  await db.delete(schema.spendingGroups);
  await db.delete(schema.accounts);

  // Clear remaining campaign data
  await db.delete(schema.offers);
  await db.delete(schema.segments);
  await db.delete(schema.eligibilityRules);
  await db.delete(schema.channelPlans);
  await db.delete(schema.fulfillmentPlans);
  await db.delete(schema.controlChecklists);

  console.log("✓ Cleared all existing data");
}

/**
 * Print a summary of all seeded data
 */
function printSummary(data: {
  offers: { length: number };
  segments: { length: number };
  rules: { length: number };
  accounts: { length: number };
  creditCards: { length: number };
  accountCreditCardsData: { length: number };
  spendingGroups: { length: number };
  spendingGroupAccountsData: { length: number };
  enrollments: { length: number };
  transactions: { length: number };
}) {
  console.log("\n✅ Database seed completed successfully!");
  console.log("\nSummary:");
  console.log(`- ${data.offers.length} offers`);
  console.log(`- ${data.segments.length} segments`);
  console.log(`- ${data.rules.length} eligibility rules`);
  console.log("- 3 campaigns (1 LIVE, 1 IN_REVIEW, 1 ENDED)");
  console.log("- 1 channel plan");
  console.log("- 1 fulfillment plan");
  console.log("- 1 control checklist");
  console.log("- 9 approvals");
  console.log("- 4 audit log entries");
  console.log("- 2 simulation runs (1 E2E Test, 1 Spend Stim)");
  console.log(`- ${data.accounts.length} accounts`);
  console.log(`- ${data.creditCards.length} credit cards`);
  console.log(`- ${data.accountCreditCardsData.length} account-credit card links`);
  console.log(`- ${data.spendingGroups.length} spending groups`);
  console.log(`- ${data.spendingGroupAccountsData.length} account-group links`);
  console.log(`- ${data.enrollments.length} offer enrollments`);
  console.log(`- ${data.transactions.length} transactions`);
}

/**
 * Main seed function - orchestrates all seeding in dependency order
 */
async function seed() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data
  await clearDatabase();

  // ==========================================
  // CAMPAIGN & OFFER DATA (no dependencies)
  // ==========================================

  // Seed independent entities first
  const offers = await seedOffers();
  const segments = await seedSegments();
  const rules = await seedEligibilityRules();

  // Seed plans (channel, fulfillment, control checklist)
  const plans = await seedPlans();

  // Seed campaigns (depends on offers, segments, rules, plans)
  const campaigns = await seedCampaigns({
    offers,
    segments,
    rules,
    channelPlanId: plans.channelPlan.id,
    fulfillmentPlanId: plans.fulfillmentPlan.id,
    controlChecklistId: plans.controlChecklist.id,
  });

  // ==========================================
  // ACCOUNT-LEVEL DATA
  // ==========================================

  // Seed accounts
  const accounts = await seedAccounts();

  // Seed credit cards (depends on accounts)
  const { creditCards, accountCreditCardsData } = await seedCreditCards(accounts);

  // Seed spending groups (depends on accounts, segments, campaigns)
  const { spendingGroups, spendingGroupAccountsData } = await seedSpendingGroups({
    accounts,
    segments,
    campaigns,
  });

  // Seed enrollments (depends on accounts, offers, campaigns)
  const enrollments = await seedEnrollments({
    accounts,
    offers,
    campaigns,
  });

  // Seed transactions (depends on accounts, enrollments, credit cards)
  const transactions = await seedTransactions({
    accounts,
    enrollments,
    accountCreditCardsData,
  });

  // Print summary
  printSummary({
    offers,
    segments,
    rules,
    accounts,
    creditCards,
    accountCreditCardsData,
    spendingGroups,
    spendingGroupAccountsData,
    enrollments,
    transactions,
  });
}

// Execute seed
seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
