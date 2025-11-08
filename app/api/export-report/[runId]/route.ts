import { NextRequest, NextResponse } from "next/server";
import { buildReport } from "@/lib/adapters/mock/export";

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

    const reportContent = await buildReport(runId);

    return new NextResponse(reportContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="simulation-report-${runId}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}

