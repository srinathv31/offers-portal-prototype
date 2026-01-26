/**
 * Database Seed Orchestrator
 *
 * This file orchestrates all seed-data modules to populate the database
 * with mock data for development and demo purposes.
 *
 * Data Scale (using faker.js):
 * - 200 accounts across 4 tiers
 * - ~8,000 transactions (30-50 per account)
 * - ~100 offer enrollments
 * - 5 spending groups with dynamic account assignment
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
import { seedDisclosures } from "./seed-data/disclosures";

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

  // Clear disclosure data
  await db.delete(schema.campaignDisclosures);
  await db.delete(schema.offerDisclosures);

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
  disclosures: { length: number };
}) {
  const avgTransactionsPerAccount = Math.round(
    data.transactions.length / data.accounts.length
  );

  console.log("\n✅ Database seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("━".repeat(50));
  console.log(`  Offers:              ${data.offers.length}`);
  console.log(`  Segments:            ${data.segments.length}`);
  console.log(`  Eligibility Rules:   ${data.rules.length}`);
  console.log(`  Campaigns:           3 (LIVE, IN_REVIEW, ENDED)`);
  console.log("━".repeat(50));
  console.log(`  Accounts:            ${data.accounts.length}`);
  console.log(`  Credit Cards:        ${data.creditCards.length}`);
  console.log(`  Card-Account Links:  ${data.accountCreditCardsData.length}`);
  console.log("━".repeat(50));
  console.log(`  Spending Groups:     ${data.spendingGroups.length}`);
  console.log(`  Group Memberships:   ${data.spendingGroupAccountsData.length}`);
  console.log("━".repeat(50));
  console.log(`  Enrollments:         ${data.enrollments.length}`);
  console.log(`  Transactions:        ${data.transactions.length}`);
  console.log(`  Avg Tx/Account:      ${avgTransactionsPerAccount}`);
  console.log("━".repeat(50));
  console.log(`  Disclosures:         ${data.disclosures.length}`);
  console.log("━".repeat(50));
  console.log("\n🎯 Ready for demo!");
  console.log("   - Confidence distribution: 80% HIGH, 15% MEDIUM, 5% LOW");
  console.log("   - Transactions are aligned with spending group categories");
  console.log("   - Spend Stim simulation will show varied confidence levels");
}

/**
 * Main seed function - orchestrates all seeding in dependency order
 */
async function seed() {
  console.log("🌱 Starting database seed...\n");
  console.log("═".repeat(50));

  const startTime = Date.now();

  // Clear existing data
  await clearDatabase();

  console.log("\n📦 Seeding campaign & offer data...");
  console.log("─".repeat(50));

  // ==========================================
  // CAMPAIGN & OFFER DATA (no dependencies)
  // ==========================================

  // Seed independent entities first
  const offers = await seedOffers();
  const segments = await seedSegments();
  const rules = await seedEligibilityRules();

  // Seed plans (channel, fulfillment, control checklist)
  const plans = await seedPlans();

  // Seed disclosure documents (depends on offers, uploads to Supabase Storage)
  const disclosures = await seedDisclosures(offers);

  // Seed campaigns (depends on offers, segments, rules, plans)
  const campaigns = await seedCampaigns({
    offers,
    segments,
    rules,
    channelPlanId: plans.channelPlan.id,
    fulfillmentPlanId: plans.fulfillmentPlan.id,
    controlChecklistId: plans.controlChecklist.id,
  });

  console.log("\n👥 Seeding account data...");
  console.log("─".repeat(50));

  // ==========================================
  // ACCOUNT-LEVEL DATA
  // ==========================================

  // Seed accounts (200 accounts with tier distribution)
  const accounts = await seedAccounts();

  // Seed credit cards (depends on accounts)
  const { creditCards, accountCreditCardsData } = await seedCreditCards(accounts);

  // Seed spending groups (depends on accounts, segments, campaigns)
  const { spendingGroups, spendingGroupAccountsData, groupAssignments } =
    await seedSpendingGroups({
      accounts,
      segments,
      campaigns,
    });

  console.log("\n📈 Seeding enrollment & transaction data...");
  console.log("─".repeat(50));

  // Seed enrollments (depends on accounts, offers, campaigns)
  const enrollments = await seedEnrollments({
    accounts,
    offers,
    campaigns,
  });

  // Seed transactions (depends on accounts, enrollments, credit cards, spending groups)
  const transactions = await seedTransactions({
    accounts,
    enrollments,
    offers,
    accountCreditCardsData,
    groupAssignments,
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

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
    disclosures,
  });

  console.log(`\n⏱️  Completed in ${duration}s`);
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
