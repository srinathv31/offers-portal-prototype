/**
 * Seed accounts data using Faker.js
 *
 * Creates 200 accounts with tier distribution:
 * - DIAMOND: 15 accounts (7.5%)
 * - PLATINUM: 35 accounts (17.5%)
 * - GOLD: 60 accounts (30%)
 * - STANDARD: 90 accounts (45%)
 */

import { db } from "../index";
import * as schema from "../schema";
import {
  generateAllAccounts,
  type GeneratedAccount,
  type SpendingProfile,
} from "./generators";

export interface SeededAccount {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: "DIAMOND" | "PLATINUM" | "GOLD" | "STANDARD";
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  creditLimit: number;
  currentBalance: number;
  annualSpend: number;
  memberSince: Date;
  metadata: Record<string, unknown> | null;
  spendingProfile: SpendingProfile;
}

/**
 * Seed accounts data
 * Creates 200 accounts across all tiers using faker-generated data
 */
export async function seedAccounts(): Promise<SeededAccount[]> {
  console.log("Creating accounts...");

  // Generate accounts using faker
  const generatedAccounts = generateAllAccounts();

  // Prepare data for database insertion (without spendingProfile which isn't in schema)
  const accountsData = generatedAccounts.map((account: GeneratedAccount) => ({
    accountNumber: account.accountNumber,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    tier: account.tier,
    status: account.status,
    creditLimit: account.creditLimit,
    currentBalance: account.currentBalance,
    annualSpend: account.annualSpend,
    memberSince: account.memberSince,
    metadata: account.metadata,
  }));

  const createdAccounts = await db
    .insert(schema.accounts)
    .values(accountsData)
    .returning();

  // Combine created accounts with spending profiles for downstream use
  const accountsWithProfiles: SeededAccount[] = createdAccounts.map(
    (account, index) => ({
      ...account,
      spendingProfile: generatedAccounts[index].spendingProfile,
    })
  );

  // Log tier distribution
  const tierCounts = accountsWithProfiles.reduce((acc, account) => {
    acc[account.tier] = (acc[account.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`✓ Created ${createdAccounts.length} accounts`);
  console.log(
    `  Distribution: DIAMOND: ${tierCounts.DIAMOND || 0}, PLATINUM: ${
      tierCounts.PLATINUM || 0
    }, GOLD: ${tierCounts.GOLD || 0}, STANDARD: ${tierCounts.STANDARD || 0}`
  );

  return accountsWithProfiles;
}
