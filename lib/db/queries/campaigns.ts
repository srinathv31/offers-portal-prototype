import { db } from "../index";
import {
  campaigns,
  campaignOffers,
  campaignSegments,
  campaignEligibilityRules,
  offers,
  segments,
  eligibilityRules,
  channelPlans,
  fulfillmentPlans,
  controlChecklists,
  approvals,
  auditLogs,
} from "../schema";
import { eq, inArray } from "drizzle-orm";

export async function getCampaigns() {
  return await db.select().from(campaigns).orderBy(campaigns.createdAt);
}

export async function getCampaignById(id: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: {
      channelPlan: true,
      fulfillmentPlan: true,
      controlChecklist: true,
    },
  });

  if (!campaign) {
    return null;
  }

  // Get related offers
  const campaignOfferLinks = await db
    .select()
    .from(campaignOffers)
    .where(eq(campaignOffers.campaignId, id));

  const offerIds = campaignOfferLinks.map((link) => link.offerId);
  const campaignOffersList =
    offerIds.length > 0
      ? await db.select().from(offers).where(inArray(offers.id, offerIds))
      : [];

  // Get related segments
  const segmentLinks = await db
    .select()
    .from(campaignSegments)
    .where(eq(campaignSegments.campaignId, id));

  const segmentIds = segmentLinks.map((link) => link.segmentId);
  const campaignSegmentsList =
    segmentIds.length > 0
      ? await db.select().from(segments).where(inArray(segments.id, segmentIds))
      : [];

  // Get eligibility rules
  const ruleLinks = await db
    .select()
    .from(campaignEligibilityRules)
    .where(eq(campaignEligibilityRules.campaignId, id));

  const ruleIds = ruleLinks.map((link) => link.eligibilityRuleId);
  const campaignRules =
    ruleIds.length > 0
      ? await db
          .select()
          .from(eligibilityRules)
          .where(inArray(eligibilityRules.id, ruleIds))
      : [];

  // Get approvals
  const campaignApprovals = await db
    .select()
    .from(approvals)
    .where(eq(approvals.campaignId, id));

  return {
    ...campaign,
    offers: campaignOffersList,
    segments: campaignSegmentsList,
    eligibilityRules: campaignRules,
    approvals: campaignApprovals,
  };
}

export async function createCampaign(data: {
  name: string;
  purpose: string;
  status?: "DRAFT" | "IN_REVIEW" | "TESTING" | "LIVE" | "ENDED";
  startDate?: Date;
  endDate?: Date;
  ownerIds?: string[];
  offerIds?: string[];
  segmentIds?: string[];
  eligibilityRuleIds?: string[];
  channelPlanId?: string;
  fulfillmentPlanId?: string;
}) {
  const [newCampaign] = await db
    .insert(campaigns)
    .values({
      name: data.name,
      purpose: data.purpose,
      status: data.status || "DRAFT",
      startDate: data.startDate,
      endDate: data.endDate,
      ownerIds: data.ownerIds || [],
      channelPlanId: data.channelPlanId,
      fulfillmentPlanId: data.fulfillmentPlanId,
    })
    .returning();

  // Link offers
  if (data.offerIds && data.offerIds.length > 0) {
    await db.insert(campaignOffers).values(
      data.offerIds.map((offerId) => ({
        campaignId: newCampaign.id,
        offerId,
      }))
    );
  }

  // Link segments
  if (data.segmentIds && data.segmentIds.length > 0) {
    await db.insert(campaignSegments).values(
      data.segmentIds.map((segmentId) => ({
        campaignId: newCampaign.id,
        segmentId,
      }))
    );
  }

  // Link eligibility rules
  if (data.eligibilityRuleIds && data.eligibilityRuleIds.length > 0) {
    await db.insert(campaignEligibilityRules).values(
      data.eligibilityRuleIds.map((ruleId) => ({
        campaignId: newCampaign.id,
        eligibilityRuleId: ruleId,
      }))
    );
  }

  // Create audit log
  await db.insert(auditLogs).values({
    campaignId: newCampaign.id,
    actor: data.ownerIds?.[0] || "system",
    action: "CAMPAIGN_CREATED",
    payload: { name: data.name },
  });

  return newCampaign;
}

export async function updateCampaignStatus(
  id: string,
  status: "DRAFT" | "IN_REVIEW" | "TESTING" | "LIVE" | "ENDED"
) {
  const [updated] = await db
    .update(campaigns)
    .set({ status, updatedAt: new Date() })
    .where(eq(campaigns.id, id))
    .returning();

  await db.insert(auditLogs).values({
    campaignId: id,
    actor: "system",
    action: "CAMPAIGN_STATUS_UPDATED",
    payload: { status },
  });

  return updated;
}
