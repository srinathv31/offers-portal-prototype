import { db } from "../index";
import * as schema from "../schema";

type Account = { id: string };
type Offer = { id: string };
type Campaign = { id: string };

interface SeedEnrollmentsDeps {
  accounts: Account[];
  offers: Offer[];
  campaigns: {
    campaign1: Campaign;
    campaign3: Campaign;
  };
}

/**
 * Seed offer enrollments with varying progress statuses
 */
export async function seedEnrollments(deps: SeedEnrollmentsDeps) {
  const { accounts, offers, campaigns } = deps;

  console.log("Creating account offer enrollments...");

  const enrollmentsData = [
    // Amazon 3× Points enrollments (offer 0) - target $1000
    {
      accountId: accounts[0].id, // Victoria
      offerId: offers[0].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[1].id, // Alexander
      offerId: offers[0].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[3].id, // William
      offerId: offers[0].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[7].id, // Daniel
      offerId: offers[0].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[13].id, // Benjamin
      offerId: offers[0].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[2].id, // Isabella
      offerId: offers[1].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[4].id, // Sophia
      offerId: offers[1].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[9].id, // Michael
      offerId: offers[1].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[5].id, // James
      offerId: offers[2].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[6].id, // Emma
      offerId: offers[2].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[10].id, // Ava
      offerId: offers[2].id,
      campaignId: campaigns.campaign1.id,
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
      accountId: accounts[9].id, // Michael
      offerId: offers[3].id,
      campaignId: campaigns.campaign3.id,
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
      accountId: accounts[10].id, // Ava
      offerId: offers[3].id,
      campaignId: campaigns.campaign3.id,
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
      accountId: accounts[15].id, // Lucas
      offerId: offers[3].id,
      campaignId: campaigns.campaign3.id,
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
      accountId: accounts[0].id, // Victoria
      offerId: offers[4].id,
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
      accountId: accounts[1].id, // Alexander
      offerId: offers[4].id,
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
      accountId: accounts[4].id, // Sophia
      offerId: offers[4].id,
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
      accountId: accounts[5].id, // James
      offerId: offers[7].id,
      campaignId: campaigns.campaign3.id,
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
      accountId: accounts[11].id, // Ethan
      offerId: offers[7].id,
      campaignId: campaigns.campaign3.id,
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

  return createdEnrollments;
}

