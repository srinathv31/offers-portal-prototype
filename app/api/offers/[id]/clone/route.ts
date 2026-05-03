import { NextRequest, NextResponse } from "next/server";
import { cloneOffer } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, effectiveFrom, effectiveTo } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const cloned = await cloneOffer(id, {
      name: name.trim(),
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
    });

    if (!cloned) {
      return NextResponse.json(
        { error: "Source offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      offerId: cloned.id,
      message: "Offer cloned successfully",
    });
  } catch (error) {
    console.error("[Clone Offer API] Error:", error);
    return NextResponse.json(
      { error: "Failed to clone offer" },
      { status: 500 }
    );
  }
}
