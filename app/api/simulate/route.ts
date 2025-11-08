import { NextRequest, NextResponse } from "next/server";
import { startSimulation } from "@/lib/adapters/mock/simulation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId is required" },
        { status: 400 }
      );
    }

    const run = await startSimulation(campaignId);

    return NextResponse.json({ runId: run.id });
  } catch (error) {
    console.error("Error starting simulation:", error);
    return NextResponse.json(
      { error: "Failed to start simulation" },
      { status: 500 }
    );
  }
}

