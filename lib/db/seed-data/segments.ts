import { db } from "../index";
import * as schema from "../schema";

/**
 * Seed segments data
 * Creates 3 customer segments with different sources and criteria
 */
export async function seedSegments() {
  console.log("Creating segments...");

  const segmentsData = [
    {
      name: "Holiday High Spenders",
      source: "CDC" as const,
      definitionJson: {
        criteria: {
          annualSpend: { min: 50000 },
          lastPurchaseDate: { within: "90 days" },
          seasonalActivity: "high",
        },
        estimatedSize: 125000,
      },
    },
    {
      name: "Amazon Enthusiasts",
      source: "RAHONA" as const,
      definitionJson: {
        criteria: {
          vendor: "Amazon",
          monthlyTransactions: { min: 5 },
          avgTransactionAmount: { min: 75 },
        },
        estimatedSize: 85000,
      },
    },
    {
      name: "Travel Frequent Flyers",
      source: "CUSTOM" as const,
      definitionJson: {
        criteria: {
          category: "Travel",
          annualSpend: { min: 10000 },
          travelFrequency: "monthly",
        },
        estimatedSize: 42000,
      },
    },
  ];

  const createdSegments = await db
    .insert(schema.segments)
    .values(segmentsData)
    .returning();

  console.log(`✓ Created ${createdSegments.length} segments`);

  return createdSegments;
}

