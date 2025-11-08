import { NextRequest, NextResponse } from "next/server";
import {
  runAutoControls,
  triggerApprovals,
  goLive,
} from "@/lib/adapters/mock/approvals";
import { getCampaignById } from "@/lib/db/queries/campaigns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "campaign id is required" },
        { status: 400 }
      );
    }

    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.status !== "IN_REVIEW") {
      return NextResponse.json(
        { error: "Campaign must be IN_REVIEW to publish" },
        { status: 400 }
      );
    }

    // Run auto controls
    const controlsResult = await runAutoControls(id);

    if (!controlsResult.pass) {
      return NextResponse.json(
        {
          error: "Auto controls failed",
          controls: controlsResult,
        },
        { status: 400 }
      );
    }

    // Trigger approvals
    const approvalsResult = await triggerApprovals(id);

    // If all approvals are already complete, go live
    if (approvalsResult.allApproved) {
      await goLive(id);
      return NextResponse.json({
        success: true,
        message: "Campaign published successfully",
        status: "LIVE",
      });
    }

    // Otherwise, return pending approvals
    return NextResponse.json({
      success: true,
      message: "Approvals triggered",
      approvals: approvalsResult.approvals,
      status: "IN_REVIEW",
    });
  } catch (error) {
    console.error("Error publishing campaign:", error);
    return NextResponse.json(
      { error: "Failed to publish campaign" },
      { status: 500 }
    );
  }
}

