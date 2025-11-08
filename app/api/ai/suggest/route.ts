import { NextRequest, NextResponse } from "next/server";
import { generateCampaignStrategy } from "@/lib/ai/strategy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { season, objective, targetSegment, budget } = body;

    if (!objective) {
      return NextResponse.json(
        { error: "Objective is required" },
        { status: 400 }
      );
    }

    const suggestion = await generateCampaignStrategy({
      season,
      objective,
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

