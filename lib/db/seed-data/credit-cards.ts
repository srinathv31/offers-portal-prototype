/**
 * Seed credit cards with faker-based generation
 *
 * Creates 1-2 credit cards per account based on tier:
 * - DIAMOND/PLATINUM: 2 cards each
 * - GOLD/STANDARD: 1 card each
 */

import { faker } from "@faker-js/faker";
import { db } from "../index";
import * as schema from "../schema";
import { generateCardNumber } from "./utils";

// Re-seed faker for credit card generation
faker.seed(11111);

type Account = {
  id: string;
  tier: string;
  status: string;
  creditLimit: number;
};

type CreditCardProduct =
  | "FLEXPAY"
  | "DOUBLE_UP"
  | "CASH_CREDIT"
  | "FIRST_CLASS"
  | "CLEAR";

/**
 * Credit card products available for each tier
 */
const tierProducts: Record<string, CreditCardProduct[]> = {
  DIAMOND: ["FIRST_CLASS", "DOUBLE_UP", "CASH_CREDIT"],
  PLATINUM: ["DOUBLE_UP", "CASH_CREDIT", "FLEXPAY"],
  GOLD: ["CASH_CREDIT", "FLEXPAY", "CLEAR"],
  STANDARD: ["FLEXPAY", "CLEAR"],
};

/**
 * Preferred categories for secondary cards
 */
const preferredCategories = [
  "Dining",
  "Travel",
  "Groceries",
  "Online Shopping",
  "Gas Stations",
  null,
];

/**
 * Seed credit cards and link them to accounts
 * Returns both the created credit cards and the account-credit card link data
 */
export async function seedCreditCards(accounts: Account[]) {
  console.log("Creating credit cards...");

  const creditCardsData: Array<{
    creditCardProduct: CreditCardProduct;
    cardNumber: string;
    lastFourDigits: string;
    creditLimit: number;
    currentBalance: number;
    openedAt: Date;
    expirationDate: Date;
    isActive: boolean;
  }> = [];

  const accountCreditCardsData: Array<{
    accountId: string;
    creditCardId: string;
    isPrimary: boolean;
    addedAt: Date;
    usageCount: number;
    lastUsedAt: Date | null;
    preferredForCategory: string | null;
  }> = [];

  // Track card index for unique last four digits
  let cardCounter = 1000;

  // Create 1-2 credit cards per account based on tier
  for (const account of accounts) {
    const products = tierProducts[account.tier] || tierProducts.STANDARD;
    const numCards =
      account.tier === "DIAMOND" || account.tier === "PLATINUM" ? 2 : 1;

    for (let cardIndex = 0; cardIndex < numCards; cardIndex++) {
      const product = products[cardIndex % products.length];
      const lastFour = String(cardCounter++).padStart(4, "0");

      // Opened 1-5 years ago, with higher tier accounts having older cards
      const tierYearsBonus =
        account.tier === "DIAMOND"
          ? 2
          : account.tier === "PLATINUM"
          ? 1
          : 0;
      const openedYearsAgo = faker.number.int({ min: 1, max: 3 }) + tierYearsBonus;
      const openedAt = new Date();
      openedAt.setFullYear(openedAt.getFullYear() - openedYearsAgo);
      openedAt.setMonth(faker.number.int({ min: 0, max: 11 }));

      // Expiration 2-4 years in the future
      const expirationDate = new Date();
      expirationDate.setFullYear(
        expirationDate.getFullYear() + faker.number.int({ min: 2, max: 4 })
      );

      // Credit limit based on tier and account limit
      const cardCreditLimit = Math.floor(
        account.creditLimit * (cardIndex === 0 ? 0.6 : 0.4)
      );

      // Current balance: 5-35% utilization for active accounts
      const utilizationRate = faker.number.float({ min: 0.05, max: 0.35 });
      const currentBalance =
        account.status === "CLOSED"
          ? 0
          : Math.floor(cardCreditLimit * utilizationRate);

      creditCardsData.push({
        creditCardProduct: product,
        cardNumber: generateCardNumber(lastFour),
        lastFourDigits: lastFour,
        creditLimit: cardCreditLimit,
        currentBalance,
        openedAt,
        expirationDate,
        isActive: account.status === "ACTIVE",
      });
    }
  }

  const createdCreditCards = await db
    .insert(schema.creditCards)
    .values(creditCardsData)
    .returning();

  console.log(`✓ Created ${createdCreditCards.length} credit cards`);

  // Link credit cards to accounts
  console.log("Linking credit cards to accounts...");

  let cardIndex = 0;
  for (const account of accounts) {
    const numCards =
      account.tier === "DIAMOND" || account.tier === "PLATINUM" ? 2 : 1;

    for (let j = 0; j < numCards; j++) {
      const creditCard = createdCreditCards[cardIndex];
      const isPrimary = j === 0;

      // Usage count based on tier
      const baseUsage = faker.number.int({ min: 10, max: 40 });
      const tierBonus =
        account.tier === "DIAMOND"
          ? 30
          : account.tier === "PLATINUM"
          ? 20
          : account.tier === "GOLD"
          ? 10
          : 0;
      const usageCount = baseUsage + tierBonus;

      // Last used within the last 30 days for active accounts
      const daysAgo = faker.number.int({ min: 0, max: 30 });
      const lastUsed = new Date();
      lastUsed.setDate(lastUsed.getDate() - daysAgo);

      // Secondary cards get category preferences for smart card selection
      const preferredCategory =
        j === 1 ? faker.helpers.arrayElement(preferredCategories) : null;

      accountCreditCardsData.push({
        accountId: account.id,
        creditCardId: creditCard.id,
        isPrimary,
        addedAt: creditCard.openedAt,
        usageCount,
        lastUsedAt: account.status === "ACTIVE" ? lastUsed : null,
        preferredForCategory: preferredCategory,
      });

      cardIndex++;
    }
  }

  await db.insert(schema.accountCreditCards).values(accountCreditCardsData);

  // Calculate statistics
  const singleCardAccounts = accounts.filter(
    (a) => a.tier === "GOLD" || a.tier === "STANDARD"
  ).length;
  const multiCardAccounts = accounts.length - singleCardAccounts;

  console.log(
    `✓ Linked ${accountCreditCardsData.length} credit cards to ${accounts.length} accounts`
  );
  console.log(
    `  ${multiCardAccounts} accounts with 2 cards, ${singleCardAccounts} accounts with 1 card`
  );

  return { creditCards: createdCreditCards, accountCreditCardsData };
}
