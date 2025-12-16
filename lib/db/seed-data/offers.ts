import { db } from "../index";
import * as schema from "../schema";

/**
 * Seed offers data
 * Creates 8 different offer types including points multipliers, cashback, bonuses, and discounts
 */
export async function seedOffers() {
  console.log("Creating offers...");

  const offersData = [
    {
      name: "Amazon 3× Points",
      type: "POINTS_MULTIPLIER" as const,
      vendor: "Amazon",
      parameters: {
        multiplier: 3,
        basePoints: 1,
        category: "Online Shopping",
        minPurchase: 25,
      },
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 100000, // $1000 in cents
        vendor: "Amazon",
        timeframeDays: 90,
      },
    },
    {
      name: "Target 5% Weekend",
      type: "CASHBACK" as const,
      vendor: "Target",
      parameters: {
        cashbackPercent: 5,
        daysOfWeek: ["Saturday", "Sunday"],
        maxCashback: 50,
      },
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 50000, // $500 in cents
        vendor: "Target",
        timeframeDays: 60,
      },
    },
    {
      name: "Starbucks Bonus",
      type: "BONUS" as const,
      vendor: "Starbucks",
      parameters: {
        bonusPoints: 500,
        minSpend: 50,
        timeframe: "30 days",
      },
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 5000, // $50 in cents
        vendor: "Starbucks",
        timeframeDays: 30,
      },
    },
    {
      name: "Recurring Groceries Booster",
      type: "POINTS_MULTIPLIER" as const,
      vendor: null,
      parameters: {
        multiplier: 2,
        category: "Groceries",
        recurring: true,
        minMonthlySpend: 100,
      },
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 30000, // $300 in cents per month
        category: "Groceries",
        timeframeDays: 30,
      },
    },
    {
      name: "Travel Miles Accelerator",
      type: "POINTS_MULTIPLIER" as const,
      vendor: null,
      parameters: {
        multiplier: 5,
        category: "Travel",
        includesAirlines: true,
        includesHotels: true,
      },
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 200000, // $2000 in cents
        category: "Travel",
        timeframeDays: 120,
      },
    },
    {
      name: "Dining Cashback",
      type: "CASHBACK" as const,
      vendor: null,
      parameters: {
        cashbackPercent: 3,
        category: "Dining",
        maxCashback: 75,
      },
      hasProgressTracking: false,
      progressTarget: null,
    },
    {
      name: "Gas Station Rewards",
      type: "POINTS_MULTIPLIER" as const,
      vendor: null,
      parameters: {
        multiplier: 3,
        category: "Gas Stations",
        maxPointsPerMonth: 5000,
      },
      hasProgressTracking: false,
      progressTarget: null,
    },
    {
      name: "Fitness Membership Discount",
      type: "DISCOUNT" as const,
      vendor: "Nike",
      parameters: {
        discountPercent: 15,
        category: "Fitness",
        validVendors: ["Nike", "Adidas", "Lululemon"],
      },
      hasProgressTracking: true,
      progressTarget: {
        targetAmount: 25000, // $250 in cents
        vendor: "Nike",
        timeframeDays: 60,
      },
    },
  ];

  const createdOffers = await db
    .insert(schema.offers)
    .values(offersData)
    .returning();

  console.log(`✓ Created ${createdOffers.length} offers`);

  return createdOffers;
}

