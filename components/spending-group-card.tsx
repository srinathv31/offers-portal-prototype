"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountTierBadge } from "@/components/account-tier-badge";
import { SpendingGroupAccountsDialog } from "@/components/spending-group-accounts-dialog";
import type { AccountTier } from "@/lib/db/schema";
import { Users, DollarSign, ChevronDown, ChevronUp, Link as LinkIcon } from "lucide-react";

interface Account {
  id: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  tier: AccountTier;
  annualSpend: number;
}

interface Segment {
  id: string;
  name: string;
}

interface SpendingGroupCardProps {
  id: string;
  name: string;
  description?: string | null;
  accountCount: number;
  avgSpend: number; // in cents
  accounts?: Account[];
  segments?: Segment[];
  className?: string;
  defaultExpanded?: boolean;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function SpendingGroupCard({
  name,
  description,
  accountCount,
  avgSpend,
  accounts = [],
  segments = [],
  className,
  defaultExpanded = false,
}: SpendingGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const displayedAccounts = accounts.slice(0, 5);
  const hasMoreAccounts = accounts.length > 5;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{name}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{accountCount.toLocaleString()}</span>{" "}
              <span className="text-muted-foreground">accounts</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{formatCurrency(avgSpend)}</span>{" "}
              <span className="text-muted-foreground">avg spend</span>
            </span>
          </div>
        </div>

        {/* Linked Segments */}
        {segments.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Linked Segments
            </p>
            <div className="flex flex-wrap gap-2">
              {segments.map((segment) => (
                <Badge key={segment.id} variant="outline" className="text-xs">
                  {segment.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Account List */}
        {isExpanded && displayedAccounts.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                Member Accounts
              </p>
              {accounts.length > 0 && (
                <SpendingGroupAccountsDialog
                  groupName={name}
                  accounts={accounts}
                  trigger={
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      View All ({accounts.length})
                    </Button>
                  }
                />
              )}
            </div>
            <div className="space-y-2">
              {displayedAccounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                      {account.firstName[0]}
                      {account.lastName[0]}
                    </div>
                    <span className="font-medium">
                      {account.firstName} {account.lastName}
                    </span>
                    <AccountTierBadge tier={account.tier} showIcon={false} className="text-xs" />
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrency(account.annualSpend)}
                  </span>
                </Link>
              ))}
              {hasMoreAccounts && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{accounts.length - 5} more accounts
                </p>
              )}
            </div>
          </div>
        )}

        {isExpanded && displayedAccounts.length === 0 && (
          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground text-center py-4">
              No accounts in this group
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

