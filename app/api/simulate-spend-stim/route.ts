import { NextRequest, NextResponse } from "next/server";
import { startSpendStimSimulation } from "@/lib/adapters/mock/spend-stim";
import { getCampaignSpendingGroups } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check if this is a form submission (from campaign detail page)
    const contentType = request.headers.get("content-type");
    const isFormSubmission = contentType?.includes(
      "application/x-www-form-urlencoded"
    );

    let campaignId: string;

    if (isFormSubmission) {
      // Handle form data
      const searchParams = request.nextUrl.searchParams;
      campaignId = searchParams.get("campaignId") || "";
    } else {
      // Handle JSON body
      const body = await request.json();
      campaignId = body.campaignId;
    }

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    // Verify campaign has spending groups
    const spendingGroups = await getCampaignSpendingGroups(campaignId);
    if (spendingGroups.length === 0) {
      if (isFormSubmission) {
        // Redirect back to campaign page with error
        const redirectUrl = new URL(`/campaigns/${campaignId}`, request.url);
        redirectUrl.searchParams.set("error", "no-spending-groups");
        return NextResponse.redirect(redirectUrl, 303);
      }
      return NextResponse.json(
        { error: "Campaign has no linked spending groups. Spend Stim simulation requires spending groups." },
        { status: 400 }
      );
    }

    const run = await startSpendStimSimulation(campaignId);

    // If it's a form submission, redirect to the test runner page
    if (isFormSubmission) {
      const redirectUrl = new URL(`/testing/${run.id}`, request.url);
      return NextResponse.redirect(redirectUrl, 303);
    }

    // Otherwise return JSON (for API calls)
    return NextResponse.json({
      runId: run.id,
      status: "started",
      simulationType: "SPEND_STIM",
      run,
    });
  } catch (error) {
    console.error("[Spend Stim API] Error:", error);
    
    // Check if this is a form submission for error redirect
    const contentType = request.headers.get("content-type");
    const isFormSubmission = contentType?.includes(
      "application/x-www-form-urlencoded"
    );
    
    if (isFormSubmission) {
      const searchParams = request.nextUrl.searchParams;
      const campaignId = searchParams.get("campaignId");
      if (campaignId) {
        const redirectUrl = new URL(`/campaigns/${campaignId}`, request.url);
        redirectUrl.searchParams.set("error", "simulation-failed");
        return NextResponse.redirect(redirectUrl, 303);
      }
    }
    
    return NextResponse.json(
      { error: "Failed to start Spend Stim simulation" },
      { status: 500 }
    );
  }
}

