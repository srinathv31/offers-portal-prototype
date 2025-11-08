import { NextRequest, NextResponse } from "next/server";
import { getRunStatus } from "@/lib/adapters/mock/simulation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json(
        { error: "runId query parameter is required" },
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

    return NextResponse.json({ run });
  } catch (error) {
    console.error("[Simulate Status API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get simulation status" },
      { status: 500 }
    );
  }
}

