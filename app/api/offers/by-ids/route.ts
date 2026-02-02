import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { offers } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json(
        { error: "ids query parameter is required" },
        { status: 400 }
      );
    }

    const idArray = ids.split(",").filter(Boolean);
    if (idArray.length === 0) {
      return NextResponse.json([]);
    }

    const results = await db.query.offers.findMany({
      where: inArray(offers.id, idArray),
      with: {
        disclosures: true,
        campaignOffers: {
          with: {
            campaign: true,
          },
        },
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Offers By IDs] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}
