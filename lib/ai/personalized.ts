import type { OfferType, AccountTier } from "@/lib/db/schema";

// Types for personalized offer suggestions
export type PersonalizedChannel = "EMAIL" | "IN_APP" | "LETTER" | "IN_STORE";
export type OutreachStatus =
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "ENGAGED"
  | "EXPIRED";
export type Urgency = "LOW" | "MEDIUM" | "HIGH";

export interface PersonalizedOfferSuggestion {
  id: string;
  offerName: string;
  offerType: OfferType;
  reasoning: string;
  recommendedChannels: PersonalizedChannel[];
  linkedCampaignId?: string;
  linkedCampaignName?: string;
  urgency: Urgency;
  estimatedValue: number; // in cents
}

export interface OutreachRecord {
  id: string;
  channel: PersonalizedChannel;
  offerName: string;
  offerType: OfferType;
  status: OutreachStatus;
  sentAt: string;
  deliveredAt?: string;
  engagedAt?: string;
  message: string;
  linkedCampaignId?: string;
  linkedCampaignName?: string;
}

export interface AccountContext {
  accountId: string;
  firstName: string;
  tier: AccountTier;
  annualSpend: number;
  topCategories: Array<{
    category: string;
    totalSpend: number;
    transactionCount: number;
  }>;
  recentTransactions: Array<{
    merchant: string;
    category: string;
    amount: number;
  }>;
  currentEnrollments: Array<{ offerName: string; offerType: OfferType }>;
}

/**
 * Generate personalized offer suggestions based on account context
 */
export function generatePersonalizedOfferSuggestions(
  context: AccountContext
): PersonalizedOfferSuggestion[] {
  const { tier, annualSpend, topCategories, currentEnrollments } = context;
  const suggestions: PersonalizedOfferSuggestion[] = [];

  // Get enrolled offer names to avoid duplicates
  const enrolledOfferNames = new Set(
    currentEnrollments.map((e) => e.offerName.toLowerCase())
  );

  // Calculate tier multiplier for offer values
  const tierMultiplier: Record<AccountTier, number> = {
    STANDARD: 1,
    GOLD: 1.5,
    PLATINUM: 2,
    DIAMOND: 3,
  };
  const multiplier = tierMultiplier[tier];

  // High spender detection
  const isHighSpender = annualSpend > 5000000; // > $50k

  // Analyze top categories and generate relevant offers
  if (topCategories.length > 0) {
    const topCategory = topCategories[0];

    // Category-specific offers
    const categoryOffers: Record<string, PersonalizedOfferSuggestion[]> = {
      Dining: [
        {
          id: `dining-cashback-${Date.now()}`,
          offerName: `${Math.round(5 * multiplier)}% Dining Cashback`,
          offerType: "CASHBACK",
          reasoning: `Based on ${
            topCategory.transactionCount
          } dining transactions totaling ${formatCurrency(
            topCategory.totalSpend
          )}, this offer maximizes rewards on your most frequent spending category.`,
          recommendedChannels: ["EMAIL", "IN_APP"],
          urgency: topCategory.totalSpend > 100000 ? "HIGH" : "MEDIUM",
          estimatedValue: Math.round(
            topCategory.totalSpend * 0.05 * multiplier
          ),
        },
        {
          id: `dining-points-${Date.now()}`,
          offerName: `${Math.round(3 * multiplier)}× Points at Restaurants`,
          offerType: "POINTS_MULTIPLIER",
          reasoning:
            "Earn accelerated points on your favorite dining experiences.",
          recommendedChannels: ["IN_APP", "EMAIL"],
          urgency: "MEDIUM",
          estimatedValue: Math.round(
            topCategory.totalSpend * 0.03 * multiplier
          ),
        },
      ],
      Travel: [
        {
          id: `travel-bonus-${Date.now()}`,
          offerName: `${formatCurrency(
            Math.round(5000 * multiplier)
          )} Travel Credit`,
          offerType: "BONUS",
          reasoning: `Your travel spending of ${formatCurrency(
            topCategory.totalSpend
          )} qualifies you for an exclusive travel credit bonus.`,
          recommendedChannels: ["EMAIL", "LETTER"],
          urgency: isHighSpender ? "HIGH" : "MEDIUM",
          estimatedValue: Math.round(5000 * multiplier),
        },
        {
          id: `travel-points-${Date.now()}`,
          offerName: `${Math.round(
            5 * multiplier
          )}× Points on Airlines & Hotels`,
          offerType: "POINTS_MULTIPLIER",
          reasoning: "Maximize rewards on your frequent travel bookings.",
          recommendedChannels: ["EMAIL", "IN_APP"],
          urgency: "MEDIUM",
          estimatedValue: Math.round(
            topCategory.totalSpend * 0.05 * multiplier
          ),
        },
      ],
      Shopping: [
        {
          id: `shopping-discount-${Date.now()}`,
          offerName: `${Math.round(10 * multiplier)}% Retail Discount`,
          offerType: "DISCOUNT",
          reasoning: `Enjoy exclusive savings on retail purchases based on your shopping patterns.`,
          recommendedChannels: ["IN_APP", "EMAIL"],
          urgency: "MEDIUM",
          estimatedValue: Math.round(topCategory.totalSpend * 0.1 * multiplier),
        },
      ],
      Grocery: [
        {
          id: `grocery-cashback-${Date.now()}`,
          offerName: `${Math.round(4 * multiplier)}% Grocery Cashback`,
          offerType: "CASHBACK",
          reasoning: `Earn cashback on your regular grocery shopping at stores like ${getMerchantFromCategory(
            "Grocery"
          )}.`,
          recommendedChannels: ["EMAIL", "IN_STORE"],
          urgency: "MEDIUM",
          estimatedValue: Math.round(
            topCategory.totalSpend * 0.04 * multiplier
          ),
        },
      ],
      Gas: [
        {
          id: `gas-cashback-${Date.now()}`,
          offerName: `${Math.round(5 * multiplier)}% Gas Station Cashback`,
          offerType: "CASHBACK",
          reasoning: "Save on every fill-up at gas stations nationwide.",
          recommendedChannels: ["IN_APP", "EMAIL"],
          urgency: "LOW",
          estimatedValue: Math.round(
            topCategory.totalSpend * 0.05 * multiplier
          ),
        },
      ],
      Entertainment: [
        {
          id: `entertainment-bonus-${Date.now()}`,
          offerName: `${formatCurrency(
            Math.round(2500 * multiplier)
          )} Entertainment Bonus`,
          offerType: "BONUS",
          reasoning: "Enjoy bonus rewards on streaming, concerts, and events.",
          recommendedChannels: ["IN_APP", "EMAIL"],
          urgency: "LOW",
          estimatedValue: Math.round(2500 * multiplier),
        },
      ],
    };

    // Add category-specific offers
    const categorySpecificOffers = categoryOffers[topCategory.category] || [];
    for (const offer of categorySpecificOffers) {
      if (!enrolledOfferNames.has(offer.offerName.toLowerCase())) {
        suggestions.push(offer);
      }
    }

    // Add offers for second category if exists
    if (topCategories.length > 1) {
      const secondCategory = topCategories[1];
      const secondCategoryOffers =
        categoryOffers[secondCategory.category] || [];
      if (
        secondCategoryOffers.length > 0 &&
        !enrolledOfferNames.has(secondCategoryOffers[0].offerName.toLowerCase())
      ) {
        suggestions.push({
          ...secondCategoryOffers[0],
          id: `${secondCategoryOffers[0].id}-secondary`,
          urgency: "LOW",
        });
      }
    }
  }

  // Tier-based exclusive offers
  if (tier === "PLATINUM" || tier === "DIAMOND") {
    const exclusiveOffer: PersonalizedOfferSuggestion = {
      id: `tier-exclusive-${Date.now()}`,
      offerName: `${tier} Member Exclusive: ${formatCurrency(
        Math.round(10000 * multiplier)
      )} Statement Credit`,
      offerType: "BONUS",
      reasoning: `As a valued ${tier} member, you qualify for an exclusive statement credit after $${Math.round(
        (annualSpend / 100) * 0.1
      ).toLocaleString()} in new spending.`,
      recommendedChannels: ["LETTER", "EMAIL"],
      urgency: "HIGH",
      estimatedValue: Math.round(10000 * multiplier),
    };
    if (!enrolledOfferNames.has(exclusiveOffer.offerName.toLowerCase())) {
      suggestions.push(exclusiveOffer);
    }
  }

  // Spending milestone offers
  if (isHighSpender) {
    const milestoneOffer: PersonalizedOfferSuggestion = {
      id: `milestone-${Date.now()}`,
      offerName: "Elite Spender Bonus: 50,000 Bonus Points",
      offerType: "BONUS",
      reasoning: `Your exceptional spending of ${formatCurrency(
        annualSpend
      )} qualifies you for our elite bonus program.`,
      recommendedChannels: ["LETTER", "IN_STORE"],
      urgency: "HIGH",
      estimatedValue: 50000,
    };
    if (!enrolledOfferNames.has(milestoneOffer.offerName.toLowerCase())) {
      suggestions.push(milestoneOffer);
    }
  }

  // Ensure we have at least 2 suggestions
  if (suggestions.length < 2) {
    const fallbackOffers: PersonalizedOfferSuggestion[] = [
      {
        id: `general-cashback-${Date.now()}`,
        offerName: `${Math.round(2 * multiplier)}% Cashback on All Purchases`,
        offerType: "CASHBACK",
        reasoning:
          "Earn cashback on every purchase with no category restrictions.",
        recommendedChannels: ["EMAIL", "IN_APP"],
        urgency: "LOW",
        estimatedValue: Math.round(annualSpend * 0.02 * multiplier),
      },
      {
        id: `signup-bonus-${Date.now()}`,
        offerName: `New Offer Enrollment Bonus: ${formatCurrency(
          Math.round(5000 * multiplier)
        )}`,
        offerType: "BONUS",
        reasoning:
          "Enroll in this limited-time offer and receive a bonus reward.",
        recommendedChannels: ["EMAIL", "IN_APP"],
        urgency: "MEDIUM",
        estimatedValue: Math.round(5000 * multiplier),
      },
    ];

    for (const fallback of fallbackOffers) {
      if (suggestions.length >= 4) break;
      if (!enrolledOfferNames.has(fallback.offerName.toLowerCase())) {
        suggestions.push(fallback);
      }
    }
  }

  // Sort by urgency and limit to 4
  const urgencyOrder: Record<Urgency, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return suggestions
    .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
    .slice(0, 4);
}

/**
 * Generate mock outreach history for an account
 */
export function generateMockOutreachHistory(
  context: AccountContext,
  enrollments: Array<{
    id: string;
    offerName: string;
    offerType: OfferType;
    enrolledAt: string;
    campaignId?: string | null;
    campaignName?: string | null;
  }>
): OutreachRecord[] {
  const records: OutreachRecord[] = [];
  const channels: PersonalizedChannel[] = [
    "EMAIL",
    "IN_APP",
    "LETTER",
    "IN_STORE",
  ];

  // Weight channels based on tier
  const tierChannelWeights: Record<AccountTier, PersonalizedChannel[]> = {
    STANDARD: ["EMAIL", "IN_APP", "EMAIL", "IN_APP"],
    GOLD: ["EMAIL", "IN_APP", "EMAIL", "LETTER"],
    PLATINUM: ["LETTER", "EMAIL", "IN_APP", "IN_STORE"],
    DIAMOND: ["LETTER", "IN_STORE", "EMAIL", "IN_APP"],
  };
  const weightedChannels = tierChannelWeights[context.tier];

  // Generate records from enrollments
  for (let i = 0; i < Math.min(enrollments.length, 4); i++) {
    const enrollment = enrollments[i];
    const enrollDate = new Date(enrollment.enrolledAt);
    const sentDate = new Date(enrollDate);
    sentDate.setDate(sentDate.getDate() - Math.floor(Math.random() * 3)); // 0-2 days before enrollment

    const daysSinceSent = Math.floor(
      (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine status based on age
    let status: OutreachStatus;
    let deliveredAt: string | undefined;
    let engagedAt: string | undefined;

    if (daysSinceSent > 14) {
      status = "ENGAGED";
      deliveredAt = new Date(sentDate.getTime() + 1000 * 60 * 30).toISOString(); // 30 min after
      engagedAt = enrollment.enrolledAt; // Engaged when enrolled
    } else if (daysSinceSent > 3) {
      status = "DELIVERED";
      deliveredAt = new Date(sentDate.getTime() + 1000 * 60 * 30).toISOString();
    } else {
      status = "SENT";
    }

    const channel = weightedChannels[i % weightedChannels.length];

    records.push({
      id: `outreach-${enrollment.id}`,
      channel,
      offerName: enrollment.offerName,
      offerType: enrollment.offerType,
      status,
      sentAt: sentDate.toISOString(),
      deliveredAt,
      engagedAt,
      message: generateOutreachMessage(
        channel,
        enrollment.offerName,
        context.firstName
      ),
      linkedCampaignId: enrollment.campaignId ?? undefined,
      linkedCampaignName: enrollment.campaignName ?? undefined,
    });
  }

  // Add some additional mock outreach records
  const mockOffers = [
    { name: "Double Points Weekend", type: "POINTS_MULTIPLIER" as OfferType },
    { name: "Exclusive Member Savings", type: "DISCOUNT" as OfferType },
    { name: "Seasonal Cashback Bonus", type: "CASHBACK" as OfferType },
  ];

  for (let i = 0; i < Math.min(2, 6 - records.length); i++) {
    const offer = mockOffers[i % mockOffers.length];
    const daysAgo = 30 + Math.floor(Math.random() * 60); // 30-90 days ago
    const sentDate = new Date();
    sentDate.setDate(sentDate.getDate() - daysAgo);

    const channel = channels[Math.floor(Math.random() * channels.length)];
    const status: OutreachStatus =
      Math.random() > 0.3 ? "ENGAGED" : "DELIVERED";

    records.push({
      id: `mock-outreach-${i}-${Date.now()}`,
      channel,
      offerName: offer.name,
      offerType: offer.type,
      status,
      sentAt: sentDate.toISOString(),
      deliveredAt: new Date(sentDate.getTime() + 1000 * 60 * 30).toISOString(),
      engagedAt:
        status === "ENGAGED"
          ? new Date(sentDate.getTime() + 1000 * 60 * 60 * 24).toISOString()
          : undefined,
      message: generateOutreachMessage(channel, offer.name, context.firstName),
    });
  }

  // Sort by date descending
  return records.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );
}

/**
 * Generate channel-appropriate outreach message
 */
function generateOutreachMessage(
  channel: PersonalizedChannel,
  offerName: string,
  firstName: string
): string {
  const messages: Record<PersonalizedChannel, string[]> = {
    EMAIL: [
      `Hi ${firstName}, you've been selected for ${offerName}! Activate now to start earning.`,
      `${firstName}, don't miss out on ${offerName} - exclusively for you.`,
      `Great news, ${firstName}! ${offerName} is now available on your account.`,
    ],
    IN_APP: [
      `🎉 ${offerName} is ready to activate!`,
      `New offer available: ${offerName}`,
      `Tap to enroll in ${offerName}`,
    ],
    LETTER: [
      `Dear ${firstName}, as a valued member, we're pleased to offer you ${offerName}.`,
      `${firstName}, enjoy exclusive access to ${offerName} - details enclosed.`,
    ],
    IN_STORE: [
      `${firstName}, our branch team shared ${offerName} during your recent visit.`,
      `Personalized offer presented in-store: ${offerName}`,
    ],
  };

  const channelMessages = messages[channel];
  return channelMessages[Math.floor(Math.random() * channelMessages.length)];
}

/**
 * Helper to format currency
 */
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Get a sample merchant for a category
 */
function getMerchantFromCategory(category: string): string {
  const merchants: Record<string, string> = {
    Dining: "local restaurants",
    Travel: "airlines and hotels",
    Shopping: "your favorite retailers",
    Grocery: "Whole Foods, Kroger, and more",
    Gas: "Shell, BP, and Chevron",
    Entertainment: "streaming and events",
  };
  return merchants[category] || "participating merchants";
}
