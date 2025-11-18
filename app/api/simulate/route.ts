import { NextRequest, NextResponse } from "next/server";
import { startSimulation } from "@/lib/adapters/mock/simulation";

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

    const run = await startSimulation(campaignId);

    // If it's a form submission, redirect to the test runner page
    if (isFormSubmission) {
      const redirectUrl = new URL(`/testing/${run.id}`, request.url);
      return NextResponse.redirect(redirectUrl, 303);
    }

    // Otherwise return JSON (for API calls)
    return NextResponse.json({
      runId: run.id,
      status: "started",
      run,
    });
  } catch (error) {
    console.error("[Simulate API] Error:", error);
    return NextResponse.json(
      { error: "Failed to start simulation" },
      { status: 500 }
    );
  }
}
