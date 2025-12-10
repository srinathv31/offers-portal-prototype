"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionTable } from "@/components/transaction-table";
import { CreditCard, Calendar, X, Filter } from "lucide-react";
import type { CreditCardProduct } from "@/lib/db/schema";

interface CreditCardInfo {
  id: string;
  creditCardProduct: CreditCardProduct;
  lastFourDigits: string;
}

interface QualificationDetails {
  qualified: boolean;
  offerName?: string;
  campaignName?: string;
  reason: string;
  details?: Record<string, unknown>;
}

interface EnrollmentInfo {
  offerName: string;
  offerType: string;
  campaignName?: string | null;
}

interface Transaction {
  id: string;
  transactionDate: string;
  merchant: string;
  category: string;
  amount: number;
  qualifiesForOffer: boolean;
  metadata?: {
    qualification?: QualificationDetails;
  };
  enrollment?: EnrollmentInfo | null;
  creditCard: CreditCardInfo | null;
}

interface AccountTransactionsTabProps {
  accountId: string;
  initialTransactions: Transaction[];
}

export function AccountTransactionsTab({
  accountId,
  initialTransactions,
}: AccountTransactionsTabProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);

  const fetchTransactions = async (start?: string, end?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);

      const url = `/api/accounts/${accountId}/transactions${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data);
      setIsFiltered(!!start || !!end);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchTransactions(startDate, endDate);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    fetchTransactions();
  };

  // Set default date range to last 3 months
  useEffect(() => {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Don't set default dates automatically - let user choose
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transactions
            {isFiltered && (
              <span className="text-sm font-normal text-muted-foreground">
                (filtered)
              </span>
            )}
          </CardTitle>

          {/* Date Filter */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">
                From
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 w-[150px]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">
                To
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 w-[150px]"
                />
              </div>
            </div>
            <Button
              onClick={handleApplyFilter}
              size="sm"
              disabled={isLoading}
              className="h-9"
            >
              <Filter className="h-4 w-4 mr-1" />
              Apply
            </Button>
            {isFiltered && (
              <Button
                onClick={handleClearFilter}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="h-9"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {transactions.length} transaction
              {transactions.length === 1 ? "" : "s"}
            </div>
            <TransactionTable
              transactions={transactions.map((tx) => ({
                id: tx.id,
                transactionDate: new Date(tx.transactionDate),
                merchant: tx.merchant,
                category: tx.category,
                amount: tx.amount,
                qualifiesForOffer: tx.qualifiesForOffer,
                metadata: tx.metadata,
                enrollment: tx.enrollment,
                creditCard: tx.creditCard,
              }))}
              showQualified={true}
              showCreditCard={true}
            />
          </>
        ) : (
          <div className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isFiltered
                ? "No transactions found for the selected date range"
                : "No transactions found"}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
