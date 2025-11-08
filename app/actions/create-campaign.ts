"use server";

import { createCampaign } from "@/lib/db/queries/campaigns";
import { redirect } from "next/navigation";

export async function createCampaignAction(data: {
  name: string;
  purpose: string;
  offerIds?: string[];
  segmentIds?: string[];
  eligibilityRuleIds?: string[];
  channelPlanId?: string;
  fulfillmentPlanId?: string;
}) {
  try {
    const campaign = await createCampaign({
      ...data,
      status: "DRAFT",
    });

    redirect(`/campaigns/${campaign.id}`);
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw new Error("Failed to create campaign");
  }
}

