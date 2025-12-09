import { NextRequest, NextResponse } from "next/server";
import { getAllOffers } from "@/lib/db";
import type { OfferType } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as OfferType | null;
    const vendor = searchParams.get("vendor");
    const search = searchParams.get("search");

    const filters: any = {};
    if (type) filters.type = type;
    if (vendor) filters.vendor = vendor;
    if (search) filters.search = search;

    const offers = await getAllOffers(filters);

    return NextResponse.json(offers);
  } catch (error) {
    console.error("[Offers API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

