import { NextRequest, NextResponse } from "next/server";
import { generateCampaignStrategy } from "@/lib/ai/strategy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { season, objective, targetSegment, budget } = body;

    // Allow empty objective for auto-generation
    const objectiveToUse =
      objective || "Generate an engaging campaign for the current season";

    const suggestion = await generateCampaignStrategy({
      season,
      objective: objectiveToUse,
      targetSegment,
      budget,
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("[AI Suggest API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate strategy suggestion" },
      { status: 500 }
    );
  }
}
