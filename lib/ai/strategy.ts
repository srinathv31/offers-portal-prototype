import { generateObject, generateText } from "ai";
import { getAIModel, getProviderName } from "./config";
import {
  strategySuggestionSchema,
  type StrategyInput,
  type StrategySuggestion,
} from "./types";

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
  const { season, objective, targetSegment, budget } = input;

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
