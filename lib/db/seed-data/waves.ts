/**
 * Seed wave plans for every campaign.
 *
 * Generates a plan via the same regenerator the runtime uses, which also
 * backfills enrollment.waveId by bucketing enrolledAt into wave windows.
 */

import { db } from "../index";
import { regenerateCampaignWaves } from "@/lib/waves";

export async function seedWaves() {
  console.log("Generating wave plans...");

  const campaigns = await db.query.campaigns.findMany({
    columns: { id: true, name: true },
  });

  let total = 0;
  for (const c of campaigns) {
    const waves = await regenerateCampaignWaves(c.id);
    total += waves.length;
    console.log(`  ✓ ${c.name}: ${waves.length} waves`);
  }

  return { total, campaignCount: campaigns.length };
}
