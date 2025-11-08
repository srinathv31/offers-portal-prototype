import { db } from "../index";
import { offers, campaignOffers, campaigns } from "../schema";
import { eq, inArray } from "drizzle-orm";

export async function getOffers() {
  return await db.select().from(offers).orderBy(offers.name);
}

export async function getOfferById(id: string) {
  const offer = await db.query.offers.findFirst({
    where: eq(offers.id, id),
  });

  if (!offer) {
    return null;
  }

  // Get campaigns that use this offer
  const campaignLinks = await db
    .select()
    .from(campaignOffers)
    .where(eq(campaignOffers.offerId, id));

  const campaignIds = campaignLinks.map((link) => link.campaignId);
  const usedInCampaigns = campaignIds.length > 0
    ? await db.select().from(campaigns).where(inArray(campaigns.id, campaignIds))
    : [];

  // Get the most recent campaign for performance metrics
  const lastCampaign = usedInCampaigns.length > 0
    ? usedInCampaigns.sort(
        (a, b) =>
          (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      )[0]
    : null;

  return {
    ...offer,
    usedInCampaigns,
    lastCampaign,
  };
}

