import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface StrategySuggestion {
  nameHint?: string;
  purposeHint?: string;
  recommendedOffers?: Array<{
    name: string;
    type: string;
    vendor?: string;
    parameters?: Record<string, unknown>;
  }>;
  segments?: Array<{
    name: string;
    source: "CDC" | "RAHONA" | "CUSTOM";
    definitionJson?: Record<string, unknown>;
  }>;
  channels?: string[];
  timelines?: {
    startDate?: string;
    endDate?: string;
  };
  notes?: string[];
  vendorHintsByOfferType?: Record<string, string[]>;
}

export async function generateStrategySuggestion(
  season: string,
  objective: string
): Promise<StrategySuggestion> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a marketing strategy AI assistant for a credit card offers platform. 
          Generate campaign strategy suggestions including:
          - Campaign name and purpose
          - Recommended offers (points multipliers, cashback, bonuses)
          - Target segments
          - Marketing channels (EMAIL, MOBILE, WEB)
          - Timeline suggestions
          - Vendor recommendations (Amazon, Target, Nike, etc.)
          
          Return structured JSON that matches the StrategySuggestion interface.`,
        },
        {
          role: "user",
          content: `Generate a campaign strategy for:
          Season: ${season}
          Objective: ${objective}
          
          Provide a comprehensive strategy with specific offers, segments, and channels.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as StrategySuggestion;
    return parsed;
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

