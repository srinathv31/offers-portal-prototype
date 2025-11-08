import { NextRequest, NextResponse } from "next/server";
import { getRunStatus } from "@/lib/adapters/mock/simulation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json(
        { error: "runId is required" },
        { status: 400 }
      );
    }

    const run = await getRunStatus(runId);

    if (!run) {
      return NextResponse.json(
        { error: "Simulation run not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error getting simulation status:", error);
    return NextResponse.json(
      { error: "Failed to get simulation status" },
      { status: 500 }
    );
  }
}

