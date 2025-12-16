import { db } from "../index";
import * as schema from "../schema";
import { generateCardNumber } from "./utils";

type Account = {
  id: string;
  tier: string;
  status: string;
  creditLimit: number;
};

/**
 * Credit card products available for each tier
 */
const tierProducts = {
  DIAMOND: ["FIRST_CLASS", "DOUBLE_UP", "CASH_CREDIT"],
  PLATINUM: ["DOUBLE_UP", "CASH_CREDIT", "FLEXPAY"],
  GOLD: ["CASH_CREDIT", "FLEXPAY", "CLEAR"],
  STANDARD: ["FLEXPAY", "CLEAR"],
};

/**
 * Seed credit cards and link them to accounts
 * Returns both the created credit cards and the account-credit card link data
 */
export async function seedCreditCards(accounts: Account[]) {
  console.log("Creating credit cards...");

  const creditCardsData: Array<{
    creditCardProduct:
      | "FLEXPAY"
      | "DOUBLE_UP"
      | "CASH_CREDIT"
      | "FIRST_CLASS"
      | "CLEAR";
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

  // Create 1-2 credit cards per account based on tier
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const products = tierProducts[account.tier as keyof typeof tierProducts];
    const numCards =
      account.tier === "DIAMOND" || account.tier === "PLATINUM" ? 2 : 1;

    for (let cardIndex = 0; cardIndex < numCards; cardIndex++) {
      const product = products[cardIndex % products.length];
      const lastFour = String(1000 + i * 10 + cardIndex).padStart(4, "0");
      const openedYears = Math.floor(Math.random() * 3) + 1; // 1-3 years ago
      const openedAt = new Date();
      openedAt.setFullYear(openedAt.getFullYear() - openedYears);

      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 3);

      // Credit limit based on tier and account limit
      const cardCreditLimit = Math.floor(
        account.creditLimit * (cardIndex === 0 ? 0.6 : 0.4)
      );
      const currentBalance = Math.floor(
        cardCreditLimit * (Math.random() * 0.3)
      ); // 0-30% utilization

      creditCardsData.push({
        creditCardProduct: product as
          | "FLEXPAY"
          | "DOUBLE_UP"
          | "CASH_CREDIT"
          | "FIRST_CLASS"
          | "CLEAR",
        cardNumber: generateCardNumber(lastFour),
        lastFourDigits: lastFour,
        creditLimit: cardCreditLimit,
        currentBalance: currentBalance,
        openedAt: openedAt,
        expirationDate: expirationDate,
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
  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const numCards =
      account.tier === "DIAMOND" || account.tier === "PLATINUM" ? 2 : 1;

    for (let j = 0; j < numCards; j++) {
      const creditCard = createdCreditCards[cardIndex];
      const isPrimary = j === 0; // First card is primary

      // Simulate usage
      const usageCount = Math.floor(Math.random() * 50) + 10; // 10-60 transactions
      const lastUsed = new Date();
      lastUsed.setDate(lastUsed.getDate() - Math.floor(Math.random() * 30)); // Last 30 days

      // Assign preferred categories for secondary cards
      // These should match actual transaction categories for smart card selection
      const categories = [
        "Dining",
        "Travel",
        "Groceries",
        "Online Shopping",
        null,
      ];
      // Secondary cards (j === 1) get preferences; primary cards (j === 0) don't
      const preferredCategory =
        j === 1
          ? categories[Math.floor(Math.random() * categories.length)]
          : null;

      accountCreditCardsData.push({
        accountId: account.id,
        creditCardId: creditCard.id,
        isPrimary: isPrimary,
        addedAt: creditCard.openedAt,
        usageCount: usageCount,
        lastUsedAt: account.status === "ACTIVE" ? lastUsed : null,
        preferredForCategory: preferredCategory,
      });

      cardIndex++;
    }
  }

  await db.insert(schema.accountCreditCards).values(accountCreditCardsData);
  console.log(
    `✓ Linked ${accountCreditCardsData.length} credit cards to accounts`
  );

  return { creditCards: createdCreditCards, accountCreditCardsData };
}

