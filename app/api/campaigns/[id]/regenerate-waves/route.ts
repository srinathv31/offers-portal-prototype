import { NextRequest, NextResponse } from "next/server";
import { regenerateCampaignWaves } from "@/lib/waves";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const waves = await regenerateCampaignWaves(id);

    const contentType = request.headers.get("content-type");
    const isFormSubmission = contentType?.includes(
      "application/x-www-form-urlencoded"
    );

    if (isFormSubmission) {
      const redirectUrl = new URL(`/campaigns/${id}?tab=waves`, request.url);
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json({
      campaignId: id,
      waveCount: waves.length,
      waves,
    });
  } catch (error) {
    console.error("[Regenerate Waves API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to regenerate waves";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
