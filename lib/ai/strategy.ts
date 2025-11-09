import { generateObject } from "ai";
import { z } from "zod";
import { getAIProvider, getAIModel } from "./config";

// Zod schema for StrategySuggestion
const StrategySuggestionSchema = z.object({
  nameHint: z.string().optional(),
  purposeHint: z.string().optional(),
  recommendedOffers: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        vendor: z.string().optional(),
        parameters: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
  segments: z
    .array(
      z.object({
        name: z.string(),
        source: z.enum(["CDC", "RAHONA", "CUSTOM"]),
        definitionJson: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
  channels: z.array(z.string()).optional(),
  timelines: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  notes: z.array(z.string()).optional(),
  vendorHintsByOfferType: z.record(z.string(), z.array(z.string())).optional(),
});

export type StrategySuggestion = z.infer<typeof StrategySuggestionSchema>;

export async function generateStrategySuggestion(
  season: string,
  objective: string
): Promise<StrategySuggestion> {
  try {
    const provider = getAIProvider();
    const model = getAIModel();

    const { object } = await generateObject({
      model: provider(model),
      schema: StrategySuggestionSchema,
      prompt: `You are a marketing strategy AI assistant for a credit card offers platform. 
Generate campaign strategy suggestions including:
- Campaign name and purpose
- Recommended offers (points multipliers, cashback, bonuses)
- Target segments
- Marketing channels (EMAIL, MOBILE, WEB)
- Timeline suggestions
- Vendor recommendations (Amazon, Target, Nike, etc.)

Generate a campaign strategy for:
Season: ${season}
Objective: ${objective}

Provide a comprehensive strategy with specific offers, segments, and channels.`,
      temperature: 0.7,
    });

    return object;
  } catch (error) {
    console.error("Error generating AI strategy:", error);
    // Fallback to deterministic mock
    return getMockStrategySuggestion(season, objective);
  }
}

function getMockStrategySuggestion(
  season: string,
  objective: string
): StrategySuggestion {
  const seasonLower = season.toLowerCase();
  
  if (seasonLower.includes("holiday") || seasonLower.includes("winter")) {
    return {
      nameHint: "Holiday Shopping Extravaganza",
      purposeHint: "Drive Q4 holiday spending with targeted offers",
      recommendedOffers: [
        {
          name: "Amazon 3× Points",
          type: "POINTS_MULTIPLIER",
          vendor: "Amazon",
          parameters: { multiplier: 3 },
        },
        {
          name: "Target 5% Weekend Cashback",
          type: "CASHBACK",
          vendor: "Target",
          parameters: { percentage: 5 },
        },
        {
          name: "Holiday Shopping Bonus",
          type: "BONUS",
          parameters: { bonusPoints: 1000 },
        },
      ],
      segments: [
        {
          name: "Holiday High Spenders",
          source: "CDC",
        },
      ],
      channels: ["EMAIL", "MOBILE", "WEB"],
      timelines: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
      notes: [
        "Focus on high-value customers with strong purchase history",
        "Leverage holiday shopping patterns",
      ],
      vendorHintsByOfferType: {
        POINTS_MULTIPLIER: ["Amazon", "Target"],
        CASHBACK: ["Target", "Walmart"],
      },
    };
  }

  return {
    nameHint: `${season} Campaign`,
    purposeHint: objective,
    recommendedOffers: [
      {
        name: "General Points Multiplier",
        type: "POINTS_MULTIPLIER",
        parameters: { multiplier: 2 },
      },
    ],
    segments: [
      {
        name: "Active Customers",
        source: "CUSTOM",
      },
    ],
    channels: ["EMAIL"],
    notes: ["Standard campaign structure"],
  };
}

