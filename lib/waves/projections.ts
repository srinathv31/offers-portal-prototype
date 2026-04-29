import { db } from "@/lib/db";
import type { CampaignStatus } from "@/lib/db/schema";
import type { CampaignWaveRow } from "./index";

export interface WaveStats {
  activations: number;
  revenue: number; // cents
  avgLiftPct: number;
  isProjected: boolean;
}

const BASE_LIFT_MIN = 0.08;
const BASE_LIFT_MAX = 0.25;
const TIER_AVG_MULTIPLIER = 1.2; // weighted average across tier mix
// Avg projected revenue per activated customer in cents (~$85 in spend-stim)
const REVENUE_PER_ACTIVATION_CENTS = 8500;
// Activation rate baseline: ~35% of cohort activates (matches simulation.ts mock)
const ACTIVATION_RATE = 0.35;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function projectStats(
  campaignId: string,
  wave: CampaignWaveRow
): WaveStats {
  const rng = mulberry32(hashSeed(`${campaignId}:${wave.sequence}`));
  const baseLift = BASE_LIFT_MIN + rng() * (BASE_LIFT_MAX - BASE_LIFT_MIN);
  const liftPct = baseLift * TIER_AVG_MULTIPLIER * 100;
  const activationJitter = 0.85 + rng() * 0.3; // 0.85x - 1.15x
  const activations = Math.round(
    wave.customerCount * ACTIVATION_RATE * activationJitter
  );
  const revenue = Math.round(activations * REVENUE_PER_ACTIVATION_CENTS);
  return {
    activations,
    revenue,
    avgLiftPct: Math.round(liftPct * 10) / 10,
    isProjected: true,
  };
}

/**
 * Get stats for a single wave. Returns actuals (queried from enrollments)
 * for LIVE/ENDED campaigns, projected stats otherwise.
 */
export async function getWaveStats(
  campaignId: string,
  campaignStatus: CampaignStatus,
  wave: CampaignWaveRow
): Promise<WaveStats> {
  const isActual = campaignStatus === "LIVE" || campaignStatus === "ENDED";
  if (!isActual) {
    return projectStats(campaignId, wave);
  }

  const enrollments = await db.query.accountOfferEnrollments.findMany({
    where: (e, { eq }) => eq(e.waveId, wave.id),
    columns: {
      id: true,
      status: true,
      rewardEarned: true,
    },
  });

  const activations = enrollments.length;
  const revenue = enrollments.reduce(
    (sum, e) => sum + (e.rewardEarned ?? 0),
    0
  );

  // Lift % stays projection-style for LIVE/ENDED — actual lift would require a
  // control group, which the prototype doesn't have. Pin it to the projected value.
  const projected = projectStats(campaignId, wave);

  return {
    activations,
    revenue,
    avgLiftPct: projected.avgLiftPct,
    isProjected: false,
  };
}

export async function getAllWaveStats(
  campaignId: string,
  campaignStatus: CampaignStatus,
  waves: CampaignWaveRow[]
): Promise<WaveStats[]> {
  return Promise.all(
    waves.map((w) => getWaveStats(campaignId, campaignStatus, w))
  );
}
