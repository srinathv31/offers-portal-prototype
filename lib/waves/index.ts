import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { db, getCampaignTargetAccountCount } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CampaignStatus, WaveStatus } from "@/lib/db/schema";
import {
  computeWaveStatus,
  generateWavePlan,
  type GeneratedWave,
} from "./generate";

export interface CampaignWaveRow {
  id: string;
  campaignId: string;
  sequence: number;
  rolloutPct: number;
  customerCount: number;
  startDate: Date | null;
  endDate: Date | null;
  status: WaveStatus;
  planVersion: number;
  generatedAt: Date;
}

function toRow(
  raw: typeof schema.campaignWaves.$inferSelect
): CampaignWaveRow {
  return {
    id: raw.id,
    campaignId: raw.campaignId,
    sequence: raw.sequence,
    rolloutPct: parseFloat(String(raw.rolloutPct)),
    customerCount: raw.customerCount,
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: raw.status as WaveStatus,
    planVersion: raw.planVersion,
    generatedAt: raw.generatedAt,
  };
}

/**
 * Fetch the wave plan for a campaign. Lazy-creates a plan if none exists,
 * so the Waves UI always has something to render.
 */
export async function getCampaignWaves(
  campaignId: string
): Promise<CampaignWaveRow[]> {
  const existing = await db.query.campaignWaves.findMany({
    where: (w, { eq }) => eq(w.campaignId, campaignId),
    orderBy: (w, { asc }) => [asc(w.sequence)],
  });

  if (existing.length > 0) {
    return existing.map(toRow);
  }

  await regenerateCampaignWaves(campaignId);
  const fresh = await db.query.campaignWaves.findMany({
    where: (w, { eq }) => eq(w.campaignId, campaignId),
    orderBy: (w, { asc }) => [asc(w.sequence)],
  });
  return fresh.map(toRow);
}

/**
 * Regenerate the wave plan for a campaign:
 *   1. Null out enrollment.waveId for this campaign's enrollments
 *   2. Delete existing campaignWaves rows
 *   3. Generate a fresh plan (bumping plan version) and insert
 *   4. Backfill waveId on enrollments by bucketing enrolledAt
 */
export async function regenerateCampaignWaves(
  campaignId: string
): Promise<CampaignWaveRow[]> {
  const campaign = await db.query.campaigns.findFirst({
    where: (c, { eq }) => eq(c.id, campaignId),
  });
  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  const totalCustomers = await getCampaignTargetAccountCount(campaignId);

  const previous = await db.query.campaignWaves.findFirst({
    where: (w, { eq }) => eq(w.campaignId, campaignId),
    orderBy: (w, { desc }) => [desc(w.planVersion)],
  });
  const nextVersion = (previous?.planVersion ?? 0) + 1;

  const generated: GeneratedWave[] = generateWavePlan({
    campaignId,
    totalCustomers,
    startDate: campaign.startDate ?? null,
    endDate: campaign.endDate ?? null,
    seed: `${campaignId}:v${nextVersion}`,
  });

  const now = new Date();
  const status = campaign.status as CampaignStatus;

  const insertedRows = await db.transaction(async (tx) => {
    await tx
      .update(schema.accountOfferEnrollments)
      .set({ waveId: null })
      .where(eq(schema.accountOfferEnrollments.campaignId, campaignId));

    await tx
      .delete(schema.campaignWaves)
      .where(eq(schema.campaignWaves.campaignId, campaignId));

    const inserted = await tx
      .insert(schema.campaignWaves)
      .values(
        generated.map((w) => ({
          campaignId,
          sequence: w.sequence,
          rolloutPct: w.rolloutPct.toFixed(2),
          customerCount: w.customerCount,
          startDate: w.startDate,
          endDate: w.endDate,
          status: computeWaveStatus(
            { startDate: w.startDate, endDate: w.endDate },
            now,
            status
          ),
          planVersion: nextVersion,
        }))
      )
      .returning();

    // Backfill: bucket existing enrollments into waves by enrolledAt window.
    // Only meaningful for campaigns with concrete date windows.
    if (campaign.startDate && campaign.endDate) {
      for (const wave of inserted) {
        if (!wave.startDate || !wave.endDate) continue;
        await tx
          .update(schema.accountOfferEnrollments)
          .set({ waveId: wave.id })
          .where(
            and(
              eq(schema.accountOfferEnrollments.campaignId, campaignId),
              isNull(schema.accountOfferEnrollments.waveId),
              gte(schema.accountOfferEnrollments.enrolledAt, wave.startDate),
              lte(schema.accountOfferEnrollments.enrolledAt, wave.endDate)
            )
          );
      }
      // Catch any stragglers outside the windows: bucket into nearest wave by date.
      const orphaned = await tx.query.accountOfferEnrollments.findMany({
        where: (e, { eq, and, isNull }) =>
          and(eq(e.campaignId, campaignId), isNull(e.waveId)),
      });
      for (const e of orphaned) {
        const enrolled = e.enrolledAt.getTime();
        let bestId: string | null = null;
        let bestDelta = Infinity;
        for (const w of inserted) {
          if (!w.startDate || !w.endDate) continue;
          const mid =
            (w.startDate.getTime() + w.endDate.getTime()) / 2;
          const delta = Math.abs(enrolled - mid);
          if (delta < bestDelta) {
            bestDelta = delta;
            bestId = w.id;
          }
        }
        if (bestId) {
          await tx
            .update(schema.accountOfferEnrollments)
            .set({ waveId: bestId })
            .where(eq(schema.accountOfferEnrollments.id, e.id));
        }
      }
    }

    return inserted;
  });

  return insertedRows.map(toRow);
}
