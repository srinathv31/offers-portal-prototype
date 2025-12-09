import { NextRequest, NextResponse } from "next/server";
import { getSpendingGroupWithAccounts } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const group = await getSpendingGroupWithAccounts(id);

    if (!group) {
      return NextResponse.json(
        { error: "Spending group not found" },
        { status: 404 }
      );
    }

    // Format response with all relevant metadata
    const response = {
      id: group.id,
      name: group.name,
      description: group.description,
      accountCount: group.spendingGroupAccounts.length,
      avgSpend: group.avgSpend,
      criteria: group.criteria,
      segments: group.segmentSpendingGroups.map((ssg) => ({
        id: ssg.segment.id,
        name: ssg.segment.name,
        source: ssg.segment.source,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Spending Group API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch spending group" },
      { status: 500 }
    );
  }
}

