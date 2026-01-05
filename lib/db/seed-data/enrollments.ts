/**
 * Seed offer enrollments with realistic distribution
 *
 * Creates ~100 enrollments across accounts with:
 * - 25% Completed
 * - 60% In Progress
 * - 15% Expired/Opted Out
 */

import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import type { AccountTier } from "../schema";
import type { SpendingProfile } from "./generators";

// Re-seed faker for enrollment generation
faker.seed(67890);

interface Account {
  id: string;
  tier: AccountTier;
  annualSpend: number;
  spendingProfile: SpendingProfile;
}

interface Offer {
  id: string;
  name: string;
  vendor: string | null;
  hasProgressTracking: boolean;
  progressTarget: {
    targetAmount?: number;
    vendor?: string;
    category?: string;
    timeframeDays?: number;
  } | null;
  parameters: Record<string, unknown> | null;
}

interface Campaign {
  id: string;
}

interface SeedEnrollmentsDeps {
  accounts: Account[];
  offers: Offer[];
  campaigns: {
    campaign1: Campaign;
    campaign3: Campaign;
  };
}

type EnrollmentStatus = "COMPLETED" | "IN_PROGRESS" | "EXPIRED" | "OPTED_OUT";

/**
 * Seed offer enrollments with varying progress statuses
 */
export async function seedEnrollments(deps: SeedEnrollmentsDeps) {
  const { accounts, offers, campaigns } = deps;

  console.log("Creating account offer enrollments...");

  const enrollmentsData: Array<{
    accountId: string;
    offerId: string;
    campaignId: string | null;
    status: EnrollmentStatus;
    enrolledAt: Date;
    expiresAt: Date;
    targetAmount: number;
    currentProgress: number;
    progressPct: string;
    completedAt: Date | null;
    rewardEarned: number | null;
  }> = [];

  // Get offers with progress tracking
  const trackableOffers = offers.filter((o) => o.hasProgressTracking);

  // Select ~50% of accounts for enrollments (higher tier accounts more likely)
  const enrolledAccounts = accounts.filter((account) => {
    const tierChance =
      account.tier === "DIAMOND"
        ? 0.8
        : account.tier === "PLATINUM"
        ? 0.65
        : account.tier === "GOLD"
        ? 0.45
        : 0.3;
    return faker.number.float() < tierChance;
  });

  // Each enrolled account gets 1-3 offer enrollments
  for (const account of enrolledAccounts) {
    const numEnrollments = faker.number.int({ min: 1, max: 3 });
    const selectedOffers = faker.helpers.arrayElements(
      trackableOffers,
      Math.min(numEnrollments, trackableOffers.length)
    );

    for (const offer of selectedOffers) {
      // Skip if account already has this offer
      const existing = enrollmentsData.find(
        (e) => e.accountId === account.id && e.offerId === offer.id
      );
      if (existing) continue;

      // Determine status with distribution: 25% completed, 60% in progress, 15% expired/opted out
      const statusRoll = faker.number.float();
      let status: EnrollmentStatus;
      if (statusRoll < 0.25) {
        status = "COMPLETED";
      } else if (statusRoll < 0.85) {
        status = "IN_PROGRESS";
      } else if (statusRoll < 0.95) {
        status = "EXPIRED";
      } else {
        status = "OPTED_OUT";
      }

      // Generate dates
      const enrolledAt = generateEnrollmentDate(status);
      const timeframeDays = offer.progressTarget?.timeframeDays || 90;
      const expiresAt = new Date(enrolledAt);
      expiresAt.setDate(expiresAt.getDate() + timeframeDays);

      // Calculate progress based on status
      const targetAmount = offer.progressTarget?.targetAmount || 10000;
      const { currentProgress, progressPct, completedAt, rewardEarned } =
        calculateProgress(status, targetAmount, enrolledAt, offer);

      // Assign to campaign (most to campaign1, some to campaign3, some standalone)
      let campaignId: string | null = null;
      const campaignRoll = faker.number.float();
      if (campaignRoll < 0.6) {
        campaignId = campaigns.campaign1.id;
      } else if (campaignRoll < 0.8) {
        campaignId = campaigns.campaign3.id;
      }
      // else null for standalone enrollments

      enrollmentsData.push({
        accountId: account.id,
        offerId: offer.id,
        campaignId,
        status,
        enrolledAt,
        expiresAt,
        targetAmount,
        currentProgress,
        progressPct,
        completedAt,
        rewardEarned,
      });
    }
  }

  // Insert enrollments
  const createdEnrollments = await db
    .insert(schema.accountOfferEnrollments)
    .values(enrollmentsData)
    .returning();

  // Calculate statistics
  const statusCounts = createdEnrollments.reduce(
    (acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`✓ Created ${createdEnrollments.length} offer enrollments`);
  console.log(
    `  Status distribution: COMPLETED: ${statusCounts.COMPLETED || 0}, IN_PROGRESS: ${statusCounts.IN_PROGRESS || 0}, EXPIRED: ${statusCounts.EXPIRED || 0}, OPTED_OUT: ${statusCounts.OPTED_OUT || 0}`
  );

  return createdEnrollments;
}

/**
 * Generate enrollment date based on status
 */
function generateEnrollmentDate(status: EnrollmentStatus): Date {
  const now = new Date();

  if (status === "COMPLETED") {
    // Enrolled 30-90 days ago
    const daysAgo = faker.number.int({ min: 30, max: 90 });
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  } else if (status === "IN_PROGRESS") {
    // Enrolled 1-60 days ago
    const daysAgo = faker.number.int({ min: 1, max: 60 });
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  } else if (status === "EXPIRED") {
    // Enrolled 90-180 days ago (already expired)
    const daysAgo = faker.number.int({ min: 90, max: 180 });
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  } else {
    // OPTED_OUT - enrolled 15-45 days ago
    const daysAgo = faker.number.int({ min: 15, max: 45 });
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date;
  }
}

/**
 * Calculate progress based on enrollment status
 */
function calculateProgress(
  status: EnrollmentStatus,
  targetAmount: number,
  enrolledAt: Date,
  offer: Offer
): {
  currentProgress: number;
  progressPct: string;
  completedAt: Date | null;
  rewardEarned: number | null;
} {
  if (status === "COMPLETED") {
    // 100% progress, completed sometime after enrollment
    const daysSinceEnrollment = Math.floor(
      (Date.now() - enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const completionDays = faker.number.int({
      min: 14,
      max: Math.max(daysSinceEnrollment - 5, 15),
    });
    const completedAt = new Date(enrolledAt);
    completedAt.setDate(completedAt.getDate() + completionDays);

    // Calculate reward based on offer type
    const rewardEarned = calculateReward(offer, targetAmount);

    return {
      currentProgress: targetAmount,
      progressPct: "100.00",
      completedAt,
      rewardEarned,
    };
  } else if (status === "IN_PROGRESS") {
    // 10-95% progress
    const progressPct = faker.number.float({ min: 10, max: 95, fractionDigits: 2 });
    const currentProgress = Math.round(targetAmount * (progressPct / 100));

    return {
      currentProgress,
      progressPct: progressPct.toFixed(2),
      completedAt: null,
      rewardEarned: null,
    };
  } else if (status === "EXPIRED") {
    // 40-85% progress (didn't quite make it)
    const progressPct = faker.number.float({ min: 40, max: 85, fractionDigits: 2 });
    const currentProgress = Math.round(targetAmount * (progressPct / 100));

    return {
      currentProgress,
      progressPct: progressPct.toFixed(2),
      completedAt: null,
      rewardEarned: null,
    };
  } else {
    // OPTED_OUT - 5-30% progress (gave up early)
    const progressPct = faker.number.float({ min: 5, max: 30, fractionDigits: 2 });
    const currentProgress = Math.round(targetAmount * (progressPct / 100));

    return {
      currentProgress,
      progressPct: progressPct.toFixed(2),
      completedAt: null,
      rewardEarned: null,
    };
  }
}

/**
 * Calculate reward based on offer type and target
 */
function calculateReward(offer: Offer, targetAmount: number): number {
  const params = offer.parameters || {};

  if (params.multiplier) {
    // Points multiplier - reward is bonus points
    const multiplier = params.multiplier as number;
    const basePoints = params.basePoints as number || 1;
    return Math.round((targetAmount / 100) * (multiplier - basePoints));
  } else if (params.cashbackPercent) {
    // Cashback - reward is cashback amount
    const percent = params.cashbackPercent as number;
    return Math.round(targetAmount * (percent / 100));
  } else if (params.bonusPoints) {
    // Fixed bonus points
    return params.bonusPoints as number;
  } else if (params.discountPercent) {
    // Discount - reward is savings amount
    const percent = params.discountPercent as number;
    return Math.round(targetAmount * (percent / 100));
  }

  // Default reward calculation
  return Math.round(targetAmount * 0.03); // 3% default
}
