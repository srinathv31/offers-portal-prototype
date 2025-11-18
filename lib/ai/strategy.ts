import { generateObject, generateText } from "ai";
import { getAIModel, getProviderName } from "./config";
import {
  strategySuggestionSchema,
  type StrategyInput,
  type StrategySuggestion,
} from "./types";

/**
 * Get the current season based on the system date
 */
export function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  // December (11) or January (0): Holiday season
  if (month === 11 || month === 0) {
    return `Holiday ${month === 11 ? year : year}`;
  }
  // February-April (1-3): Spring/Q1
  if (month >= 1 && month <= 3) {
    return `Q1 ${year}`;
  }
  // May (4): Late Spring
  if (month === 4) {
    return `Spring ${year}`;
  }
  // June-August (5-7): Summer
  if (month >= 5 && month <= 7) {
    return `Summer ${year}`;
  }
  // September-November (8-10): Fall/Back to School
  if (month >= 8 && month <= 10) {
    return `Fall ${year}`;
  }

  return `Q${Math.floor(month / 3) + 1} ${year}`;
}

/**
 * Generate a mock strategy response based on season and objective.
 * Used when AI_MOCK=true to provide realistic responses without external AI.
 */
function generateMockStrategy(input: StrategyInput): StrategySuggestion {
  const { season, objective } = input;

  // Determine season for logic
  const seasonToUse = season || getCurrentSeason();
  const seasonLower = seasonToUse.toLowerCase();

  // Detect season type
  const isHoliday =
    seasonLower.includes("holiday") || seasonLower.includes("winter");
  const isSummer = seasonLower.includes("summer");
  const isSpring = seasonLower.includes("spring") || seasonLower.includes("q1");
  const isFall =
    seasonLower.includes("fall") || seasonLower.includes("back to school");

  // Base campaign name and purpose
  let nameHint = "";
  let purposeHint = objective;
  const recommendedOffers = [];
  const segments = [];
  const channels: ("EMAIL" | "MOBILE" | "WEB" | "SMS")[] = [
    "EMAIL",
    "MOBILE",
    "WEB",
  ];
  const notes = [];

  // Generate offers and segments based on season
  if (isHoliday) {
    nameHint = "Holiday Rewards Blitz";
    purposeHint =
      "Drive holiday spending through enhanced rewards on popular retail and travel partners";

    recommendedOffers.push(
      {
        name: "5× Points on Amazon & Target",
        type: "POINTS_MULTIPLIER" as const,
        vendor: "Amazon, Target",
        reasoning:
          "Peak holiday shopping season - customers are actively purchasing gifts and household items",
      },
      {
        name: "10% Cashback on Travel",
        type: "CASHBACK" as const,
        vendor: "Delta Airlines, Marriott",
        reasoning:
          "Holiday travel is at its peak, capturing this spend drives high engagement",
      },
      {
        name: "15% Off Starbucks Gift Cards",
        type: "DISCOUNT" as const,
        vendor: "Starbucks",
        reasoning:
          "Gift cards are popular holiday presents and drive repeat engagement",
      },
      {
        name: "20,000 Bonus Points on $1000 Spend",
        type: "BONUS" as const,
        reasoning: "Incentivizes high spenders during peak shopping period",
      }
    );

    segments.push(
      {
        name: "High Holiday Spenders",
        source: "CDC" as const,
        criteria: "Customers with >$2000 spend in Nov-Dec historically",
      },
      {
        name: "Travel Enthusiasts",
        source: "RAHONA" as const,
        criteria: "Customers who book travel 2+ times per year",
      }
    );

    notes.push(
      "Competition is intense during holiday season - consider early launch",
      "Partner with top retailers for exclusive deals",
      "Monitor spending velocity and adjust offers mid-campaign if needed"
    );
  } else if (isSummer) {
    nameHint = "Summer Travel Rewards";
    purposeHint =
      "Capture summer travel and dining spend with targeted rewards";

    recommendedOffers.push(
      {
        name: "3× Points on Gas Stations",
        type: "POINTS_MULTIPLIER" as const,
        vendor: "Shell, BP, Chevron",
        reasoning: "Summer road trips drive significant gas spend",
      },
      {
        name: "8% Cashback on Dining",
        type: "CASHBACK" as const,
        vendor: "Uber Eats, DoorDash",
        reasoning: "Increased dining and outdoor activities in summer months",
      },
      {
        name: "Free Hotel Night Bonus",
        type: "BONUS" as const,
        vendor: "Marriott, Hilton",
        reasoning: "Incentivizes vacation bookings and long-term loyalty",
      }
    );

    segments.push(
      {
        name: "Summer Travelers",
        source: "CDC" as const,
        criteria: "Customers with travel spend Jun-Aug >$1500",
      },
      {
        name: "Frequent Diners",
        source: "RAHONA" as const,
        criteria: "Restaurant/delivery spend >$300/month",
      }
    );

    channels.push("SMS");
    notes.push(
      "Launch early June to capture entire summer season",
      "Consider partnerships with vacation booking platforms"
    );
  } else if (isSpring) {
    nameHint = "Spring Refresh Campaign";
    purposeHint =
      "Engage customers with fitness, travel, and home improvement rewards";

    recommendedOffers.push(
      {
        name: "5× Points on Fitness & Wellness",
        type: "POINTS_MULTIPLIER" as const,
        vendor: "Nike, Peloton, Planet Fitness",
        reasoning: "New Year resolutions and spring fitness focus",
      },
      {
        name: "12% Cashback on Home Improvement",
        type: "CASHBACK" as const,
        vendor: "Home Depot, Lowe's",
        reasoning: "Spring home projects and renovations are common",
      },
      {
        name: "15,000 Bonus Points on Travel Booking",
        type: "BONUS" as const,
        vendor: "Expedia",
        reasoning: "Spring break and summer vacation planning",
      }
    );

    segments.push(
      {
        name: "Health & Wellness Focused",
        source: "RAHONA" as const,
        criteria: "Fitness and wellness app engagement",
      },
      {
        name: "Homeowners",
        source: "CUSTOM" as const,
        criteria: "Property owners with home improvement history",
      }
    );

    notes.push(
      "Tax refund season - customers have extra spending power",
      "Align with spring break and Easter holidays"
    );
  } else if (isFall) {
    nameHint = "Back to School Savings";
    purposeHint = "Capture back-to-school spending with family-focused rewards";

    recommendedOffers.push(
      {
        name: "4× Points on Retail & Clothing",
        type: "POINTS_MULTIPLIER" as const,
        vendor: "Target, Walmart, Gap",
        reasoning: "Back-to-school shopping for clothes and supplies",
      },
      {
        name: "10% Cashback on Technology",
        type: "CASHBACK" as const,
        vendor: "Apple, Best Buy",
        reasoning: "Students need laptops, tablets, and tech for school",
      },
      {
        name: "Bonus 5,000 Points on Groceries",
        type: "BONUS" as const,
        vendor: "Whole Foods, Costco",
        reasoning: "Families stock up for the school year",
      }
    );

    segments.push(
      {
        name: "Parents & Families",
        source: "CUSTOM" as const,
        criteria: "Households with children aged 5-18",
      },
      {
        name: "Education Spenders",
        source: "CDC" as const,
        criteria: "Customers with education-related spend >$500",
      }
    );

    notes.push(
      "Launch in early August before school starts",
      "Consider college students as a sub-segment"
    );
  } else {
    // Generic campaign
    nameHint = "Everyday Rewards Boost";
    purposeHint = "Increase engagement across all spending categories";

    recommendedOffers.push(
      {
        name: "3× Points on All Purchases",
        type: "POINTS_MULTIPLIER" as const,
        reasoning: "Broad appeal across all customer segments",
      },
      {
        name: "5% Cashback on Groceries",
        type: "CASHBACK" as const,
        vendor: "Whole Foods, Kroger",
        reasoning: "Everyday essential spend - consistent engagement",
      },
      {
        name: "10,000 Bonus Points on $500 Spend",
        type: "BONUS" as const,
        reasoning: "Incentivizes increased card usage",
      }
    );

    segments.push(
      {
        name: "Active Card Users",
        source: "CDC" as const,
        criteria: "Monthly spend >$1000",
      },
      {
        name: "Engagement Opportunity",
        source: "RAHONA" as const,
        criteria: "Low engagement in past 3 months",
      }
    );
  }

  // Generate timeline
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 14); // Start in 2 weeks
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 60); // 60-day campaign

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  return {
    nameHint,
    purposeHint,
    recommendedOffers,
    segments,
    channels,
    timelines: {
      recommendedStart: formatDate(startDate),
      recommendedEnd: formatDate(endDate),
      rationale: `${seasonToUse} timing optimizes for seasonal spending patterns. 60-day duration allows for engagement and optimization.`,
    },
    notes,
    vendorHintsByOfferType: {
      CASHBACK: ["Amazon", "Whole Foods", "Target"],
      POINTS_MULTIPLIER: ["Starbucks", "Delta Airlines", "Marriott"],
      DISCOUNT: ["Nike", "Apple", "Best Buy"],
      BONUS: ["Various - based on spend threshold"],
    },
  };
}

/**
 * Generate campaign strategy suggestions using AI.
 * Uses AI SDK's generateObject for structured output with Zod validation.
 * Provider is hot-swappable via AI_PROVIDER environment variable.
 *
 * @param input - Strategy generation input (season, objective, etc.)
 * @returns AI-generated strategy suggestion
 */
export async function generateCampaignStrategy(
  input: StrategyInput
): Promise<StrategySuggestion> {
  // Check for mock mode
  if (process.env.AI_MOCK === "true") {
    console.log("[AI Strategy] Using MOCK mode");
    return generateMockStrategy(input);
  }

  // Get the configured AI model (hot-swappable)
  const model = getAIModel();
  const providerName = getProviderName();

  console.log(`[AI Strategy] Using provider: ${providerName}`);

  // Build context-aware prompt
  const prompt = buildStrategyPrompt(input);

  try {
    // For local LLMs (LM Studio), use generateText and manual JSON parsing
    // because they don't support structured output formats properly
    if (providerName === "lmstudio" || providerName === "local") {
      console.log(`[AI Strategy] Using text generation mode for local LLM`);

      const result = await generateText({
        model,
        prompt: prompt + "\n\nRespond with ONLY valid JSON, no other text.",
        temperature: 0.7,
      });

      console.log(`[AI Strategy] Raw response from local LLM:`, result.text);

      // Parse and validate JSON response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const validated = strategySuggestionSchema.parse(parsed);

      console.log(
        `[AI Strategy] Successfully generated strategy using ${providerName}`
      );
      return validated;
    }

    // For OpenAI and Anthropic, use structured output with generateObject
    const result = await generateObject({
      model,
      schema: strategySuggestionSchema,
      prompt,
      temperature: 0.7,
    });

    console.log(
      `[AI Strategy] Successfully generated strategy using ${providerName}`
    );
    return result.object;
  } catch (error) {
    console.error(
      `[AI Strategy] Error generating strategy with ${providerName}:`,
      error
    );
    throw new Error(`Failed to generate campaign strategy: ${error}`);
  }
}

/**
 * Build a season-aware prompt for strategy generation
 */
function buildStrategyPrompt(input: StrategyInput): string {
  const { season, objective, targetSegment, budget } = input;

  const seasonalContext = getSeasonalContext(season);
  const vendorSuggestions = getSeasonalVendors(season);

  let prompt = `You are a credit card campaign strategist. Generate a comprehensive campaign strategy based on the following:

**Campaign Objective:** ${objective}
`;

  if (season) {
    prompt += `\n**Season/Timing:** ${season}\n${seasonalContext}`;
  }

  if (targetSegment) {
    prompt += `\n**Target Segment:** ${targetSegment}`;
  }

  if (budget) {
    prompt += `\n**Budget:** $${budget.toLocaleString()}`;
  }

  prompt += `

**Requirements:**
1. Suggest 3-5 relevant offers that align with the objective${
    season ? ` and ${season} season` : ""
  }.
2. Recommend customer segments to target (use data sources: CDC for transaction history, RAHONA for behavioral data, or CUSTOM for specific criteria).
3. Suggest appropriate marketing channels (EMAIL, MOBILE, WEB, SMS).
4. Provide a realistic campaign timeline with start and end dates.
5. Include strategic notes about timing, competitive considerations, or risk factors.

**Vendor Suggestions:**
${vendorSuggestions}

**Offer Types Available:**
- POINTS_MULTIPLIER: Earn extra points on specific categories (e.g., 3× points on dining)
- CASHBACK: Percentage cashback on purchases (e.g., 5% back on groceries)
- DISCOUNT: Direct discount on purchases (e.g., 15% off at specific merchants)
- BONUS: Bonus points/rewards for meeting spend thresholds (e.g., 10,000 bonus points after spending $500)

**IMPORTANT:** Respond with ONLY valid JSON matching this exact structure:
{
  "nameHint": "string (optional)",
  "purposeHint": "string (optional)",
  "recommendedOffers": [
    {
      "name": "string",
      "type": "POINTS_MULTIPLIER | CASHBACK | DISCOUNT | BONUS",
      "vendor": "string (optional)",
      "reasoning": "string"
    }
  ],
  "segments": [
    {
      "name": "string",
      "source": "CDC | RAHONA | CUSTOM",
      "criteria": "string"
    }
  ],
  "channels": ["EMAIL" | "MOBILE" | "WEB" | "SMS"],
  "timelines": {
    "recommendedStart": "YYYY-MM-DD",
    "recommendedEnd": "YYYY-MM-DD",
    "rationale": "string"
  },
  "notes": ["string (optional)"],
  "vendorHintsByOfferType": {
    "OFFER_TYPE": ["vendor1", "vendor2"]
  }
}

Generate a data-driven, actionable strategy that maximizes customer engagement and campaign ROI.`;

  return prompt;
}

/**
 * Get seasonal context to enhance AI understanding
 */
function getSeasonalContext(season?: string): string {
  if (!season) return "";

  const seasonLower = season.toLowerCase();

  if (seasonLower.includes("holiday") || seasonLower.includes("winter")) {
    return `
**Seasonal Context:**
- Peak shopping season (November-December)
- High consumer spending on gifts, travel, and dining
- Competitive landscape is intense
- Focus on retail partners, e-commerce, and travel rewards
`;
  }

  if (seasonLower.includes("summer")) {
    return `
**Seasonal Context:**
- Travel and vacation season (June-August)
- Increased spending on gas, hotels, dining, and entertainment
- Family-oriented purchases (groceries, activities)
- Focus on travel, dining, and lifestyle rewards
`;
  }

  if (seasonLower.includes("spring") || seasonLower.includes("q1")) {
    return `
**Seasonal Context:**
- Tax refund season and travel planning period
- New Year resolutions (fitness, health)
- Spring break travel
- Focus on travel bookings, fitness, and fresh starts
`;
  }

  if (seasonLower.includes("fall") || seasonLower.includes("back to school")) {
    return `
**Seasonal Context:**
- Back-to-school shopping (August-September)
- Preparation for holiday season
- Increased spending on education, technology, and clothing
- Focus on retail, technology, and family-oriented rewards
`;
  }

  return "";
}

/**
 * Get season-appropriate vendor suggestions
 */
function getSeasonalVendors(season?: string): string {
  if (!season) {
    return "Popular vendors: Amazon, Target, Walmart, Starbucks, Nike, Whole Foods, Shell, Delta Airlines";
  }

  const seasonLower = season.toLowerCase();

  if (seasonLower.includes("holiday") || seasonLower.includes("winter")) {
    return `**Recommended Holiday Vendors:**
- Retail: Amazon, Target, Walmart, Best Buy, Macy's
- Dining: Starbucks, DoorDash, Uber Eats
- Travel: Delta Airlines, Marriott, Hilton
- E-commerce focus for gift shopping`;
  }

  if (seasonLower.includes("summer")) {
    return `**Recommended Summer Vendors:**
- Travel: Delta Airlines, United Airlines, Marriott, Airbnb
- Dining: Starbucks, Chipotle, local restaurants
- Gas: Shell, BP, Chevron
- Entertainment: AMC Theaters, Live Nation
- Groceries: Whole Foods, Kroger`;
  }

  if (seasonLower.includes("spring") || seasonLower.includes("q1")) {
    return `**Recommended Spring/Q1 Vendors:**
- Travel: Expedia, Delta Airlines, Marriott
- Fitness: Nike, Adidas, Planet Fitness, Peloton
- Home improvement: Home Depot, Lowe's
- Technology: Apple, Best Buy`;
  }

  if (seasonLower.includes("fall") || seasonLower.includes("back to school")) {
    return `**Recommended Fall Vendors:**
- Retail: Target, Walmart, Amazon
- Technology: Apple, Best Buy, Microsoft
- Clothing: Nike, Gap, Old Navy
- Groceries: Whole Foods, Costco`;
  }

  return "Popular vendors: Amazon, Target, Walmart, Starbucks, Nike, Whole Foods, Shell, Delta Airlines";
}
