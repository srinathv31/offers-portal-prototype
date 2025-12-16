"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountTierBadge } from "@/components/account-tier-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AccountProjection, ProjectionConfidence, AccountTier } from "@/lib/db/schema";

interface AccountProjectionsTableProps {
  projections: AccountProjection[];
  className?: string;
}

type SortField =
  | "accountName"
  | "currentMonthlySpend"
  | "projectedMonthlySpend"
  | "projectedLiftPct"
  | "confidence";
type SortDirection = "asc" | "desc";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ConfidenceBadge({ confidence }: { confidence: ProjectionConfidence }) {
  const variants: Record<
    ProjectionConfidence,
    { className: string; label: string }
  > = {
    HIGH: {
      className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: "High",
    },
    MEDIUM: {
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: "Medium",
    },
    LOW: {
      className: "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
      label: "Low",
    },
  };

  const { className, label } = variants[confidence];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function CategoryBreakdown({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  const categories = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (categories.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">No transactions</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {categories.map(([category, amount]) => (
        <Badge key={category} variant="secondary" className="text-xs">
          {category}: {formatCurrency(amount)}
        </Badge>
      ))}
    </div>
  );
}

export function AccountProjectionsTable({
  projections,
  className,
}: AccountProjectionsTableProps) {
  const [sortField, setSortField] = useState<SortField>("projectedLiftPct");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const toggleRowExpansion = (accountId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const confidenceOrder: Record<ProjectionConfidence, number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedProjections = [...projections].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "accountName":
        comparison = a.accountName.localeCompare(b.accountName);
        break;
      case "currentMonthlySpend":
        comparison = a.currentMonthlySpend - b.currentMonthlySpend;
        break;
      case "projectedMonthlySpend":
        comparison = a.projectedMonthlySpend - b.projectedMonthlySpend;
        break;
      case "projectedLiftPct":
        comparison = a.projectedLiftPct - b.projectedLiftPct;
        break;
      case "confidence":
        comparison =
          confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
    >
      {children}
      {sortField === field && (
        <span className="text-primary">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );

  if (projections.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No account projections available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Account Spending Projections ({projections.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-8"></TableHead>
                <TableHead>
                  <SortButton field="accountName">Account</SortButton>
                </TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">
                  <SortButton field="currentMonthlySpend">
                    Current Monthly
                  </SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="projectedMonthlySpend">
                    Projected Monthly
                  </SortButton>
                </TableHead>
                <TableHead className="text-right">
                  <SortButton field="projectedLiftPct">Lift %</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="confidence">Confidence</SortButton>
                </TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjections.map((projection) => {
                const isExpanded = expandedRows.has(projection.accountId);

                return (
                  <>
                    <TableRow
                      key={projection.accountId}
                      className="hover:bg-muted/30"
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRowExpansion(projection.accountId)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">
                            {projection.accountName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="font-medium">
                            {projection.accountName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <AccountTierBadge
                          tier={projection.tier as AccountTier}
                          showIcon={false}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(projection.currentMonthlySpend)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(projection.projectedMonthlySpend)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {projection.projectedLiftPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          +{formatCurrency(projection.projectedLift)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ConfidenceBadge confidence={projection.confidence} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/accounts/${projection.accountId}`}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow
                        key={`${projection.accountId}-expanded`}
                        className="bg-muted/20"
                      >
                        <TableCell colSpan={8} className="py-4">
                          <div className="pl-10">
                            <p className="text-sm font-medium mb-2">
                              Top Spending Categories
                            </p>
                            <CategoryBreakdown
                              breakdown={projection.categoryBreakdown}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

