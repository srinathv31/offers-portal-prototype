import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, purpose, suggestion } = body;

    if (!name || !purpose) {
      return NextResponse.json(
        { error: "Name and purpose are required" },
        { status: 400 }
      );
    }

    // Create campaign with basic data
    // In a full implementation, this would also create offers, segments, etc. from suggestion
    const [campaign] = await db
      .insert(campaigns)
      .values({
        name,
        purpose,
        status: "DRAFT",
        ownerIds: ["system@example.com"],
        metrics: {
          activations: 0,
          cost: 0,
          projected_lift_pct: suggestion?.recommendedOffers?.[0]?.type ? 15 : 0,
          error_rate_pct: 0,
          revenue: 0,
        },
      })
      .returning();

    return NextResponse.json({
      campaignId: campaign.id,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("[Create Campaign API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

