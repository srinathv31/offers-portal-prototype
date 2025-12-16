import { db } from "../index";
import * as schema from "../schema";

/**
 * Seed accounts data
 * Creates 20 accounts across all tiers: DIAMOND, PLATINUM, GOLD, STANDARD
 */
export async function seedAccounts() {
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

  return createdAccounts;
}

