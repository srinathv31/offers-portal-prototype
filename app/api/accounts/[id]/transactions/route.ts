import { NextRequest, NextResponse } from "next/server";
import { getAccountTransactions } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse date filters
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const filters: { startDate?: Date; endDate?: Date } = {};

    if (startDateStr) {
      filters.startDate = new Date(startDateStr);
    }

    if (endDateStr) {
      // Set end date to end of day
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
      filters.endDate = endDate;
    }

    const transactions = await getAccountTransactions(id, filters);

    // Transform transactions for the response
    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      transactionDate: tx.transactionDate,
      merchant: tx.merchant,
      category: tx.category,
      amount: tx.amount,
      qualifiesForOffer: tx.qualifiesForOffer,
      metadata: tx.metadata,
      enrollment: tx.enrollment
        ? {
            offerName: tx.enrollment.offer.name,
            offerType: tx.enrollment.offer.type,
            campaignName: tx.enrollment.campaign?.name ?? null,
          }
        : null,
      creditCard: tx.creditCard
        ? {
            id: tx.creditCard.id,
            creditCardProduct: tx.creditCard.creditCardProduct,
            lastFourDigits: tx.creditCard.lastFourDigits,
          }
        : null,
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("[Transactions API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
