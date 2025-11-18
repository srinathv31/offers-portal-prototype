import { NextRequest, NextResponse } from "next/server";
import { buildReport, serializeReport } from "@/lib/adapters/mock/export";

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

    const reportData = await buildReport(runId);
    const reportJson = serializeReport(reportData);

    return new NextResponse(reportJson, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="simulation-report-${runId}.json"`,
      },
    });
  } catch (error) {
    console.error("[Export Report API] Error:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

