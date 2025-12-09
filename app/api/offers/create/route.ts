import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Validate offer type
    const validTypes = ["POINTS_MULTIPLIER", "CASHBACK", "DISCOUNT", "BONUS"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid offer type" },
        { status: 400 }
      );
    }

    const [offer] = await db
      .insert(schema.offers)
      .values({
        name,
        type,
        vendor: vendor || null,
        parameters: parameters || {},
        hasProgressTracking: hasProgressTracking || false,
        progressTarget: progressTarget || null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      })
      .returning();

    return NextResponse.json({
      offerId: offer.id,
      message: "Offer created successfully",
    });
  } catch (error) {
    console.error("[Create Offer API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}

