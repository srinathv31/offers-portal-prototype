import type { CampaignStatus, WaveStatus } from "@/lib/db/schema";

export interface WavePlanInput {
  campaignId: string;
  totalCustomers: number;
  startDate: Date | null;
  endDate: Date | null;
  seed?: string;
}

export interface GeneratedWave {
  sequence: number;
  rolloutPct: number;
  customerCount: number;
  startDate: Date | null;
  endDate: Date | null;
}

const MIN_WAVES = 3;
const MAX_WAVES = 7;
const MIN_PCT = 3;
const MAX_PCT = 40;

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

function isMonotonic(values: number[]): boolean {
  if (values.length < 2) return true;
  const allUp = values.every((v, i) => i === 0 || v >= values[i - 1]);
  const allDown = values.every((v, i) => i === 0 || v <= values[i - 1]);
  return allUp || allDown;
}

function generatePercentages(rng: () => number, n: number): number[] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const weights = Array.from({ length: n }, () => 0.2 + rng());
    const sum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((w) => (w / sum) * 100);

    // Round and fix sum to 100
    const rounded = raw.map((r) => Math.round(r));
    let drift = 100 - rounded.reduce((a, b) => a + b, 0);
    let i = 0;
    while (drift !== 0) {
      const idx = i % n;
      const step = drift > 0 ? 1 : -1;
      if (rounded[idx] + step >= MIN_PCT && rounded[idx] + step <= MAX_PCT) {
        rounded[idx] += step;
        drift -= step;
      }
      i++;
      if (i > n * 100) break;
    }

    // Clamp to [MIN_PCT, MAX_PCT]
    let leftover = 0;
    for (let j = 0; j < n; j++) {
      if (rounded[j] < MIN_PCT) {
        leftover -= MIN_PCT - rounded[j];
        rounded[j] = MIN_PCT;
      } else if (rounded[j] > MAX_PCT) {
        leftover += rounded[j] - MAX_PCT;
        rounded[j] = MAX_PCT;
      }
    }
    // Redistribute leftover to non-clamped slots
    while (leftover !== 0) {
      const candidates = rounded
        .map((v, idx) => ({ v, idx }))
        .filter((c) =>
          leftover > 0 ? c.v < MAX_PCT : c.v > MIN_PCT
        );
      if (candidates.length === 0) break;
      const pick =
        candidates[Math.floor(rng() * candidates.length)];
      const step = leftover > 0 ? 1 : -1;
      rounded[pick.idx] += step;
      leftover -= step;
    }

    if (
      rounded.reduce((a, b) => a + b, 0) === 100 &&
      !isMonotonic(rounded)
    ) {
      return rounded;
    }
  }

  // Fallback: shuffle a known non-monotonic distribution
  const fallback =
    n === 3
      ? [40, 25, 35]
      : n === 4
      ? [10, 35, 25, 30]
      : n === 5
      ? [15, 35, 10, 25, 15]
      : n === 6
      ? [10, 25, 15, 35, 5, 10]
      : [10, 20, 15, 25, 5, 15, 10];
  return fallback;
}

function distributeCustomers(percentages: number[], total: number): number[] {
  const raw = percentages.map((p) => (p / 100) * total);
  const counts = raw.map((r) => Math.floor(r));
  const remainders = raw.map((r, i) => ({ frac: r - counts[i], i }));
  const drift = total - counts.reduce((a, b) => a + b, 0);
  remainders.sort((a, b) => b.frac - a.frac);
  for (let j = 0; j < drift && j < remainders.length; j++) {
    counts[remainders[j].i] += 1;
  }
  return counts;
}

function splitDateRange(
  start: Date,
  end: Date,
  n: number
): Array<{ start: Date; end: Date }> {
  const startMs = start.getTime();
  const totalMs = end.getTime() - startMs;
  const stepMs = totalMs / n;
  return Array.from({ length: n }, (_, i) => ({
    start: new Date(startMs + stepMs * i),
    end: new Date(startMs + stepMs * (i + 1)),
  }));
}

export function generateWavePlan(input: WavePlanInput): GeneratedWave[] {
  const seedString = input.seed ?? input.campaignId;
  const rng = mulberry32(hashSeed(seedString));

  const waveCount =
    MIN_WAVES + Math.floor(rng() * (MAX_WAVES - MIN_WAVES + 1));
  const percentages = generatePercentages(rng, waveCount);
  const counts = distributeCustomers(percentages, input.totalCustomers);

  const windows =
    input.startDate && input.endDate
      ? splitDateRange(input.startDate, input.endDate, waveCount)
      : null;

  return percentages.map((pct, i) => ({
    sequence: i + 1,
    rolloutPct: pct,
    customerCount: counts[i],
    startDate: windows ? windows[i].start : null,
    endDate: windows ? windows[i].end : null,
  }));
}

export function computeWaveStatus(
  wave: { startDate: Date | null; endDate: Date | null },
  now: Date,
  campaignStatus: CampaignStatus
): WaveStatus {
  if (
    campaignStatus === "DRAFT" ||
    campaignStatus === "IN_REVIEW" ||
    campaignStatus === "TESTING"
  ) {
    return "PENDING";
  }
  if (campaignStatus === "ENDED") {
    return "COMPLETED";
  }
  // LIVE
  if (!wave.startDate || !wave.endDate) return "PENDING";
  if (now < wave.startDate) return "PENDING";
  if (now > wave.endDate) return "COMPLETED";
  return "ACTIVE";
}
