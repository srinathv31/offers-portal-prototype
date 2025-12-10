import { NextRequest, NextResponse } from "next/server";
import { getAccountWithDetails } from "@/lib/db";
import {
  generatePersonalizedOfferSuggestions,
  generateMockOutreachHistory,
  type AccountContext,
  type PersonalizedOfferSuggestion,
  type OutreachRecord,
} from "@/lib/ai/personalized";

/**
 * GET /api/accounts/[id]/personalized-offers
 * Returns mock outreach history for the account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await getAccountWithDetails(id);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Build account context for generating outreach history
    const transactions = account.accountTransactions || [];

    // Calculate top spending categories
    const categorySpend: Record<
      string,
      { totalSpend: number; transactionCount: number }
    > = {};
    for (const tx of transactions) {
      if (!categorySpend[tx.category]) {
        categorySpend[tx.category] = { totalSpend: 0, transactionCount: 0 };
      }
      categorySpend[tx.category].totalSpend += tx.amount;
      categorySpend[tx.category].transactionCount += 1;
    }

    const topCategories = Object.entries(categorySpend)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    const context: AccountContext = {
      accountId: account.id,
      firstName: account.firstName,
      tier: account.tier,
      annualSpend: account.annualSpend,
      topCategories,
      recentTransactions: transactions.slice(0, 10).map((tx) => ({
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
      })),
      currentEnrollments: (account.accountOfferEnrollments || []).map((e) => ({
        offerName: e.offer.name,
        offerType: e.offer.type,
      })),
    };

    // Generate mock outreach history from enrollments
    const enrollments = (account.accountOfferEnrollments || []).map((e) => ({
      id: e.id,
      offerName: e.offer.name,
      offerType: e.offer.type,
      enrolledAt: e.enrolledAt.toISOString(),
      campaignId: e.campaignId,
      campaignName: e.campaign?.name ?? null,
    }));

    const outreachHistory = generateMockOutreachHistory(context, enrollments);

    return NextResponse.json({
      outreachHistory,
      accountContext: {
        firstName: account.firstName,
        tier: account.tier,
        annualSpend: account.annualSpend,
        topCategories: topCategories.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("[Personalized Offers API] GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch personalized offers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts/[id]/personalized-offers
 * Generate AI-powered personalized offer suggestions
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const account = await getAccountWithDetails(id);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Build account context for AI analysis
    const transactions = account.accountTransactions || [];

    // Calculate top spending categories
    const categorySpend: Record<
      string,
      { totalSpend: number; transactionCount: number }
    > = {};
    for (const tx of transactions) {
      if (!categorySpend[tx.category]) {
        categorySpend[tx.category] = { totalSpend: 0, transactionCount: 0 };
      }
      categorySpend[tx.category].totalSpend += tx.amount;
      categorySpend[tx.category].transactionCount += 1;
    }

    const topCategories = Object.entries(categorySpend)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    const context: AccountContext = {
      accountId: account.id,
      firstName: account.firstName,
      tier: account.tier,
      annualSpend: account.annualSpend,
      topCategories,
      recentTransactions: transactions.slice(0, 10).map((tx) => ({
        merchant: tx.merchant,
        category: tx.category,
        amount: tx.amount,
      })),
      currentEnrollments: (account.accountOfferEnrollments || []).map((e) => ({
        offerName: e.offer.name,
        offerType: e.offer.type,
      })),
    };

    // Simulate AI analysis delay
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 700)
    );

    // Generate personalized suggestions
    const suggestions = generatePersonalizedOfferSuggestions(context);

    return NextResponse.json({
      suggestions,
      analysis: {
        accountTier: account.tier,
        annualSpend: account.annualSpend,
        topCategories: topCategories.slice(0, 3),
        enrollmentCount: account.accountOfferEnrollments?.length || 0,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error("[Personalized Offers API] POST Error:", error);
    return NextResponse.json(
      { error: "Failed to generate personalized offers" },
      { status: 500 }
    );
  }
}
