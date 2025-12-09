import { NextRequest, NextResponse } from "next/server";
import { generateCampaignStrategy } from "@/lib/ai/strategy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { season, objective, targetSegment, budget, spendingGroupContext } = body;

    // Allow empty objective for auto-generation
    let objectiveToUse = objective || "Generate an engaging campaign for the current season";

    // Enhance objective with spending group context if provided
    if (spendingGroupContext) {
      const { name, accountCount, avgSpend, criteria, segments } = spendingGroupContext;
      const avgSpendFormatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(avgSpend / 100);

      let contextNote = `\n\n[Context: Targeting the "${name}" spending group with ${accountCount.toLocaleString()} accounts and ${avgSpendFormatted} average spend.`;
      
      if (segments && segments.length > 0) {
        contextNote += ` Linked segments: ${segments.join(", ")}.`;
      }
      
      if (criteria) {
        const criteriaDetails = [];
        if (criteria.tiers && criteria.tiers.length > 0) {
          criteriaDetails.push(`account tiers: ${criteria.tiers.join(", ")}`);
        }
        if (criteria.categories && criteria.categories.length > 0) {
          criteriaDetails.push(`spending categories: ${criteria.categories.join(", ")}`);
        }
        if (criteria.minAnnualSpend) {
          const minSpendFormatted = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
          }).format(criteria.minAnnualSpend / 100);
          criteriaDetails.push(`min annual spend: ${minSpendFormatted}`);
        }
        if (criteriaDetails.length > 0) {
          contextNote += ` Group criteria: ${criteriaDetails.join("; ")}.`;
        }
      }
      
      contextNote += "]";
      objectiveToUse += contextNote;
    }

    const suggestion = await generateCampaignStrategy({
      season,
      objective: objectiveToUse,
      targetSegment,
      budget,
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("[AI Suggest API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate strategy suggestion" },
      { status: 500 }
    );
  }
}
