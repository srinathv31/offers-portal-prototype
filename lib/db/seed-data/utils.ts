/**
 * Shared utility functions for database seeding
 */

/**
 * Card information for smart transaction card selection
 */
export interface CardInfo {
  cardId: string;
  isPrimary: boolean;
  preferredCategory: string | null;
}

/**
 * Generate a masked card number with last four digits visible
 */
export function generateCardNumber(lastFour: string): string {
  return `**** **** **** ${lastFour}`;
}

/**
 * Select the best card for a transaction based on category preferences
 * Uses smart logic to match category preferences or fallback to primary card
 */
export function selectCardForTransaction(
  accountId: string,
  category: string,
  accountToCards: Map<string, CardInfo[]>
): string {
  const cards = accountToCards.get(accountId);
  if (!cards || cards.length === 0) {
    throw new Error(`No cards found for account ${accountId}`);
  }

  // If account has multiple cards, check for category preference
  if (cards.length > 1) {
    // Normalize category names for matching
    const normalizeCategory = (cat: string) =>
      cat.toLowerCase().replace(/\s+/g, "");
    const normalizedTxCategory = normalizeCategory(category);

    // Look for a card with matching preferred category
    const preferredCard = cards.find(
      (c) =>
        c.preferredCategory &&
        normalizeCategory(c.preferredCategory).includes(
          normalizedTxCategory.split(/[,&]/)[0]
        )
    );

    if (preferredCard) {
      return preferredCard.cardId;
    }

    // Otherwise, 70% primary card, 30% secondary card
    const usePrimary = Math.random() < 0.7;
    const selectedCard = usePrimary
      ? cards.find((c) => c.isPrimary)
      : cards.find((c) => !c.isPrimary);

    return (selectedCard || cards[0]).cardId;
  }

  // Single card account - use that card
  return cards[0].cardId;
}

/**
 * Build a mapping of account IDs to their credit cards
 * Used for smart card selection during transaction seeding
 */
export function buildAccountToCardsMap(
  accountCreditCardsData: Array<{
    accountId: string;
    creditCardId: string;
    isPrimary: boolean;
    preferredForCategory: string | null;
  }>
): Map<string, CardInfo[]> {
  const accountToCards = new Map<string, CardInfo[]>();

  for (const accCard of accountCreditCardsData) {
    const cards = accountToCards.get(accCard.accountId) || [];
    cards.push({
      cardId: accCard.creditCardId,
      isPrimary: accCard.isPrimary,
      preferredCategory: accCard.preferredForCategory,
    });
    accountToCards.set(accCard.accountId, cards);
  }

  return accountToCards;
}

