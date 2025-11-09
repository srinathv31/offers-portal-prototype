import { z } from "zod";

// Zod schema for AI strategy suggestion
export const strategySuggestionSchema = z.object({
  nameHint: z.string().optional().describe("Suggested campaign name"),
  purposeHint: z
    .string()
    .optional()
    .describe("Suggested campaign purpose/description"),
  recommendedOffers: z
    .array(
      z.object({
        name: z.string().describe("Offer name"),
        type: z
          .enum(["POINTS_MULTIPLIER", "CASHBACK", "DISCOUNT", "BONUS"])
          .describe("Offer type"),
        vendor: z
          .string()
          .optional()
          .describe("Vendor/merchant name if applicable"),
        reasoning: z.string().describe("Why this offer is recommended"),
      })
    )
    .describe("List of recommended offers for this campaign"),
  segments: z
    .array(
      z.object({
        name: z.string().describe("Segment name"),
        source: z
          .enum(["CDC", "RAHONA", "CUSTOM"])
          .describe("Data source for segment"),
        criteria: z.string().describe("Brief description of segment criteria"),
      })
    )
    .describe("Recommended customer segments to target"),
  channels: z
    .array(z.enum(["EMAIL", "MOBILE", "WEB", "SMS"]))
    .describe("Recommended marketing channels"),
  timelines: z
    .object({
      recommendedStart: z.string().describe("Recommended campaign start date"),
      recommendedEnd: z.string().describe("Recommended campaign end date"),
      rationale: z.string().describe("Reasoning for the timeline"),
    })
    .optional()
    .describe("Suggested campaign timeline"),
  notes: z
    .array(z.string())
    .optional()
    .describe("Additional strategic notes or considerations"),
  vendorHintsByOfferType: z
    .record(z.string(), z.array(z.string()))
    .optional()
    .describe("Vendor suggestions grouped by offer type"),
});

// TypeScript type inferred from Zod schema
export type StrategySuggestion = z.infer<typeof strategySuggestionSchema>;

// Input type for strategy generation
export type StrategyInput = {
  season?: string;
  objective: string;
  targetSegment?: string;
  budget?: number;
};
