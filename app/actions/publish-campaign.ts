"use server";

import { updateCampaignStatus } from "@/lib/db/queries/campaigns";
import {
  runAutoControls,
  triggerApprovals,
  goLive,
} from "@/lib/adapters/mock/approvals";
import { getCampaignById } from "@/lib/db/queries/campaigns";

export async function publishCampaignAction(campaignId: string) {
  try {
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.status !== "IN_REVIEW") {
      throw new Error("Campaign must be IN_REVIEW to publish");
    }

    // Run auto controls
    const controlsResult = await runAutoControls(campaignId);

    if (!controlsResult.pass) {
      throw new Error("Auto controls failed");
    }

    // Trigger approvals
    const approvalsResult = await triggerApprovals(campaignId);

    // If all approvals are already complete, go live
    if (approvalsResult.allApproved) {
      await goLive(campaignId);
      return { success: true, status: "LIVE" };
    }

    // Otherwise, return pending approvals
    return {
      success: true,
      status: "IN_REVIEW",
      approvals: approvalsResult.approvals,
    };
  } catch (error) {
    console.error("Error publishing campaign:", error);
    throw error;
  }
}

