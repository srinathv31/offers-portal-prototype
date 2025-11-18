import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  campaigns,
  offers,
  segments,
  campaignOffers,
  campaignSegments,
  channelPlans,
} from "@/lib/db/schema";
import type { StrategySuggestion } from "@/lib/ai/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, purpose, suggestion, startDate, endDate, channels } = body;

    if (!name || !purpose) {
      return NextResponse.json(
        { error: "Name and purpose are required" },
        { status: 400 }
      );
    }

    // Prepare campaign dates
    let campaignStartDate: Date | undefined;
    let campaignEndDate: Date | undefined;

    if (suggestion?.timelines) {
      campaignStartDate = new Date(suggestion.timelines.recommendedStart);
      campaignEndDate = new Date(suggestion.timelines.recommendedEnd);
    } else if (startDate && endDate) {
      campaignStartDate = new Date(startDate);
      campaignEndDate = new Date(endDate);
    }

    // Create channel plan if channels or AI suggestion provided
    let channelPlanId: string | undefined;
    const channelList = suggestion?.channels || channels || [];

    if (channelList.length > 0) {
      const [channelPlan] = await db
        .insert(channelPlans)
        .values({
          channels: channelList,
          creatives: [],
          dynamicTnc: "",
        })
        .returning();
      channelPlanId = channelPlan.id;
    }

    // Create campaign with basic data
    const [campaign] = await db
      .insert(campaigns)
      .values({
        name,
        purpose,
        status: "DRAFT",
        startDate: campaignStartDate,
        endDate: campaignEndDate,
        channelPlanId,
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

    // If AI suggestion provided, create offers and segments
    if (suggestion) {
      await persistAISuggestion(campaign.id, suggestion);
    }

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

/**
 * Persist all AI suggestion data to the database
 */
async function persistAISuggestion(
  campaignId: string,
  suggestion: StrategySuggestion
) {
  // Create offers from AI recommendation
  if (suggestion.recommendedOffers && suggestion.recommendedOffers.length > 0) {
    const createdOffers = await db
      .insert(offers)
      .values(
        suggestion.recommendedOffers.map((offer) => ({
          name: offer.name,
          type: offer.type,
          vendor: offer.vendor || null,
          parameters: {
            reasoning: offer.reasoning,
          },
        }))
      )
      .returning();

    // Link offers to campaign via junction table
    if (createdOffers.length > 0) {
      await db.insert(campaignOffers).values(
        createdOffers.map((offer) => ({
          campaignId,
          offerId: offer.id,
        }))
      );
    }
  }

  // Create segments from AI recommendation
  if (suggestion.segments && suggestion.segments.length > 0) {
    const createdSegments = await db
      .insert(segments)
      .values(
        suggestion.segments.map((segment) => ({
          name: segment.name,
          source: segment.source,
          definitionJson: {
            criteria: segment.criteria,
            estimatedSize: 10000, // Default estimate
          },
        }))
      )
      .returning();

    // Link segments to campaign via junction table
    if (createdSegments.length > 0) {
      await db.insert(campaignSegments).values(
        createdSegments.map((segment) => ({
          campaignId,
          segmentId: segment.id,
        }))
      );
    }
  }

  console.log(
    `[Create Campaign] Persisted AI suggestion data for campaign ${campaignId}`
  );
}
