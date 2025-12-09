import { NextRequest, NextResponse } from "next/server";
import { getOfferWithCampaigns, updateOffer } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const offer = await getOfferWithCampaigns(id);

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("[Get Offer API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offer" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // First, check if offer exists and get its campaigns
    const existingOffer = await getOfferWithCampaigns(id);
    if (!existingOffer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    // Check for LIVE campaigns
    const liveCampaigns = existingOffer.campaignOffers
      .map((co) => co.campaign)
      .filter((c) => c.status === "LIVE");

    if (liveCampaigns.length > 0) {
      console.warn(
        `[Update Offer API] Warning: Updating offer ${id} that is used in ${liveCampaigns.length} LIVE campaigns`
      );
    }

    const {
      name,
      type,
      vendor,
      parameters,
      hasProgressTracking,
      progressTarget,
      effectiveFrom,
      effectiveTo,
    } = body;

    // Validate if type is being changed
    if (type && type !== existingOffer.type) {
      const validTypes = ["POINTS_MULTIPLIER", "CASHBACK", "DISCOUNT", "BONUS"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: "Invalid offer type" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (vendor !== undefined) updateData.vendor = vendor || null;
    if (parameters !== undefined) updateData.parameters = parameters;
    if (hasProgressTracking !== undefined)
      updateData.hasProgressTracking = hasProgressTracking;
    if (progressTarget !== undefined) updateData.progressTarget = progressTarget;
    if (effectiveFrom !== undefined)
      updateData.effectiveFrom = effectiveFrom ? new Date(effectiveFrom) : null;
    if (effectiveTo !== undefined)
      updateData.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;

    const updatedOffer = await updateOffer(id, updateData);

    return NextResponse.json({
      offer: updatedOffer,
      message: "Offer updated successfully",
      warning:
        liveCampaigns.length > 0
          ? `This offer is used in ${liveCampaigns.length} LIVE campaigns`
          : undefined,
    });
  } catch (error) {
    console.error("[Update Offer API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}

