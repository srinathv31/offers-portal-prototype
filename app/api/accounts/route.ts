import { NextRequest, NextResponse } from "next/server";
import { getAllAccounts, type AccountFilters } from "@/lib/db";
import type { AccountTier, AccountStatus } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: AccountFilters = {};
    
    const tier = searchParams.get("tier");
    if (tier && ["STANDARD", "GOLD", "PLATINUM", "DIAMOND"].includes(tier)) {
      filters.tier = tier as AccountTier;
    }
    
    const status = searchParams.get("status");
    if (status && ["ACTIVE", "SUSPENDED", "CLOSED"].includes(status)) {
      filters.status = status as AccountStatus;
    }
    
    const search = searchParams.get("search");
    if (search) {
      filters.search = search;
    }

    const accounts = await getAllAccounts(filters);
    
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

