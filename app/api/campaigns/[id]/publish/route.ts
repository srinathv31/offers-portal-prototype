import { NextRequest, NextResponse } from "next/server";
import { goLive } from "@/lib/adapters/mock/approvals";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    await goLive(id, "system@example.com");

    return NextResponse.json({
      message: "Campaign published successfully",
      campaignId: id,
    });
  } catch (error) {
    console.error("[Publish Campaign API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to publish campaign";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

