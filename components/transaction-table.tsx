"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

interface Transaction {
  id: string;
  transactionDate: Date;
  merchant: string;
  category: string;
  amount: number; // in cents
  qualifiesForOffer: boolean;
}

interface TransactionTableProps {
  transactions: Transaction[];
  className?: string;
  showQualified?: boolean;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const categoryColors: Record<string, string> = {
  Dining: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  Travel: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  Gas: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  Grocery: "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300",
  Shopping: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
  Entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  Utilities: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

function getCategoryColor(category: string): string {
  return categoryColors[category] || categoryColors.Other;
}

export function TransactionTable({
  transactions,
  className,
  showQualified = true,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        No transactions found
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {showQualified && <TableHead className="text-center">Qualified</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-sm">
                {format(new Date(tx.transactionDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="font-medium">{tx.merchant}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", getCategoryColor(tx.category))}
                >
                  {tx.category}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(tx.amount)}
              </TableCell>
              {showQualified && (
                <TableCell className="text-center">
                  {tx.qualifiesForOffer ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

