import { db } from "./index";
import {
  campaigns,
  offers,
  segments,
  eligibilityRules,
  channelPlans,
  fulfillmentPlans,
  controlChecklists,
  approvals,
  campaignOffers,
  campaignSegments,
  campaignEligibilityRules,
  auditLogs,
  simulationRuns,
} from "./schema";

export async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(campaignOffers);
  await db.delete(campaignSegments);
  await db.delete(campaignEligibilityRules);
  await db.delete(approvals);
  await db.delete(auditLogs);
  await db.delete(simulationRuns);
  await db.delete(controlChecklists);
  await db.delete(fulfillmentPlans);
  await db.delete(channelPlans);
  await db.delete(eligibilityRules);
  await db.delete(segments);
  await db.delete(offers);
  await db.delete(campaigns);

  // Create Offers
  const amazonOffer = await db
    .insert(offers)
    .values({
      name: "Amazon 3× Points",
      type: "POINTS_MULTIPLIER",
      vendor: "Amazon",
      parameters: { multiplier: 3, category: "retail" },
      effectiveFrom: new Date("2024-11-01"),
    })
    .returning();

  const targetOffer = await db
    .insert(offers)
    .values({
      name: "Target 5% Weekend Cashback",
      type: "CASHBACK",
      vendor: "Target",
      parameters: { percentage: 5, days: ["Saturday", "Sunday"] },
      effectiveFrom: new Date("2024-11-01"),
    })
    .returning();

  const groceriesOffer = await db
    .insert(offers)
    .values({
      name: "Recurring Groceries Booster",
      type: "BONUS",
      vendor: "Various",
      parameters: { bonusPoints: 500, minSpend: 100 },
      effectiveFrom: new Date("2024-11-01"),
    })
    .returning();

  const nikeOffer = await db
    .insert(offers)
    .values({
      name: "Nike 2× Points",
      type: "POINTS_MULTIPLIER",
      vendor: "Nike",
      parameters: { multiplier: 2, category: "apparel" },
      effectiveFrom: new Date("2024-11-01"),
    })
    .returning();

  const holidayOffer = await db
    .insert(offers)
    .values({
      name: "Holiday Shopping Bonus",
      type: "BONUS",
      vendor: "Various",
      parameters: { bonusPoints: 1000, period: "November-December" },
      effectiveFrom: new Date("2024-11-01"),
    })
    .returning();

  // Create Segments
  const holidaySegment = await db
    .insert(segments)
    .values({
      name: "Holiday High Spenders",
      source: "CDC",
      definitionJson: {
        criteria: "spend > $5000 in Nov-Dec",
        source: "transaction_history",
      },
    })
    .returning();

  const amazonSegment = await db
    .insert(segments)
    .values({
      name: "Amazon Enthusiasts",
      source: "RAHONA",
      definitionJson: {
        criteria: "amazon_transactions > 10/month",
        source: "behavioral_data",
      },
    })
    .returning();

  // Create Eligibility Rules
  const rule1 = await db
    .insert(eligibilityRules)
    .values({
      dsl: "credit_score >= 700 AND account_age_days >= 180",
      dataDependencies: ["credit_bureau", "account_master"],
    })
    .returning();

  const rule2 = await db
    .insert(eligibilityRules)
    .values({
      dsl: "monthly_spend >= 1000 AND no_delinquencies_last_12m",
      dataDependencies: ["transaction_history", "account_master"],
    })
    .returning();

  // Create Channel Plans
  const channelPlan1 = await db
    .insert(channelPlans)
    .values({
      channels: ["EMAIL", "MOBILE", "WEB"],
      creatives: [
        { channel: "EMAIL", preview: "Holiday campaign email creative" },
        { channel: "MOBILE", preview: "Mobile push notification" },
        { channel: "WEB", preview: "Banner ad creative" },
      ],
      dynamicTnc:
        "Offer valid through December 31, 2024. Terms and conditions apply.",
    })
    .returning();

  // Create Fulfillment Plans
  const fulfillmentPlan1 = await db
    .insert(fulfillmentPlans)
    .values({
      method: "REWARDS",
      mockAdapter: "REWARDS_ENGINE",
    })
    .returning();

  // Create Control Checklists
  const checklist1 = await db
    .insert(controlChecklists)
    .values({
      items: [
        {
          name: "PII Minimization",
          result: "PASS",
          evidenceRef: "policy_v2.1",
        },
        {
          name: "T&Cs Consistency",
          result: "PASS",
          evidenceRef: "legal_review_2024-11",
        },
        {
          name: "7-Year Retention Warning",
          result: "WARN",
          evidenceRef: "retention_policy",
        },
        {
          name: "Separation of Duties",
          result: "PASS",
          evidenceRef: "sod_matrix",
        },
      ],
    })
    .returning();

  // Create Campaigns
  const liveCampaign = await db
    .insert(campaigns)
    .values({
      name: "Holiday Shopping Extravaganza",
      purpose: "Drive Q4 holiday spending with targeted offers",
      status: "LIVE",
      startDate: new Date("2024-11-01"),
      endDate: new Date("2024-12-31"),
      ownerIds: ["user-001", "user-002"],
      metrics: {
        activations: 1250,
        revenue: 125000,
        projectedLiftPct: 15.5,
        errorRatePct: 0.8,
        cost: 50000,
      },
      channelPlanId: channelPlan1[0].id,
      fulfillmentPlanId: fulfillmentPlan1[0].id,
      controlChecklistId: checklist1[0].id,
    })
    .returning();

  const reviewCampaign = await db
    .insert(campaigns)
    .values({
      name: "Amazon Prime Day Boost",
      purpose: "Capitalize on Prime Day with enhanced rewards",
      status: "IN_REVIEW",
      startDate: new Date("2024-12-15"),
      endDate: new Date("2024-12-20"),
      ownerIds: ["user-003"],
      metrics: {
        activations: 0,
        revenue: 0,
        projectedLiftPct: 22.3,
        errorRatePct: 0,
        cost: 30000,
      },
      channelPlanId: channelPlan1[0].id,
      fulfillmentPlanId: fulfillmentPlan1[0].id,
    })
    .returning();

  const endedCampaign = await db
    .insert(campaigns)
    .values({
      name: "Back to School Promo",
      purpose: "Target families with school-related purchases",
      status: "ENDED",
      startDate: new Date("2024-08-01"),
      endDate: new Date("2024-09-15"),
      ownerIds: ["user-001"],
      metrics: {
        activations: 890,
        revenue: 89000,
        projectedLiftPct: 12.1,
        errorRatePct: 1.2,
        cost: 35000,
      },
      channelPlanId: channelPlan1[0].id,
      fulfillmentPlanId: fulfillmentPlan1[0].id,
      controlChecklistId: checklist1[0].id,
    })
    .returning();

  // Link offers to campaigns
  await db.insert(campaignOffers).values([
    { campaignId: liveCampaign[0].id, offerId: amazonOffer[0].id },
    { campaignId: liveCampaign[0].id, offerId: targetOffer[0].id },
    { campaignId: liveCampaign[0].id, offerId: holidayOffer[0].id },
    { campaignId: reviewCampaign[0].id, offerId: amazonOffer[0].id },
    { campaignId: reviewCampaign[0].id, offerId: nikeOffer[0].id },
    { campaignId: endedCampaign[0].id, offerId: groceriesOffer[0].id },
  ]);

  // Link segments to campaigns
  await db.insert(campaignSegments).values([
    { campaignId: liveCampaign[0].id, segmentId: holidaySegment[0].id },
    { campaignId: reviewCampaign[0].id, segmentId: amazonSegment[0].id },
    { campaignId: endedCampaign[0].id, segmentId: holidaySegment[0].id },
  ]);

  // Link eligibility rules to campaigns
  await db.insert(campaignEligibilityRules).values([
    { campaignId: liveCampaign[0].id, eligibilityRuleId: rule1[0].id },
    { campaignId: liveCampaign[0].id, eligibilityRuleId: rule2[0].id },
    { campaignId: reviewCampaign[0].id, eligibilityRuleId: rule1[0].id },
  ]);

  // Create Approvals
  await db.insert(approvals).values([
    {
      campaignId: reviewCampaign[0].id,
      role: "Product Owner",
      actor: "Jane Smith",
      decision: "APPROVED",
      timestamp: new Date("2024-11-05T10:00:00Z"),
    },
    {
      campaignId: reviewCampaign[0].id,
      role: "Risk/Compliance",
      actor: "John Doe",
      decision: "PENDING",
    },
    {
      campaignId: reviewCampaign[0].id,
      role: "Marketing Ops",
      decision: "PENDING",
    },
  ]);

  // Create Audit Logs
  await db.insert(auditLogs).values([
    {
      campaignId: liveCampaign[0].id,
      actor: "user-001",
      action: "CAMPAIGN_CREATED",
      payload: { name: liveCampaign[0].name },
      timestamp: new Date("2024-10-25T09:00:00Z"),
    },
    {
      campaignId: liveCampaign[0].id,
      actor: "user-002",
      action: "CAMPAIGN_PUBLISHED",
      payload: { status: "LIVE" },
      timestamp: new Date("2024-11-01T08:00:00Z"),
    },
    {
      campaignId: reviewCampaign[0].id,
      actor: "user-003",
      action: "CAMPAIGN_CREATED",
      payload: { name: reviewCampaign[0].name },
      timestamp: new Date("2024-11-04T14:00:00Z"),
    },
  ]);

  console.log("Seed data created successfully!");
}
