"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AccountTierBadge } from "@/components/account-tier-badge";
import { AccountStatusBadge } from "@/components/account-status-badge";
import type { AccountTier, AccountStatus } from "@/lib/db/schema";
import { ChevronRight, Mail, CreditCard } from "lucide-react";

interface AccountListItemProps {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: AccountTier;
  status: AccountStatus;
  annualSpend: number; // in cents
  enrollmentCount?: number;
  className?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function AccountListItem({
  id,
  accountNumber,
  firstName,
  lastName,
  email,
  tier,
  status,
  annualSpend,
  enrollmentCount,
  className,
}: AccountListItemProps) {
  return (
    <Link href={`/accounts/${id}`}>
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors group",
          className
        )}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Avatar placeholder with initials */}
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
            {firstName[0]}
            {lastName[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium group-hover:text-primary transition-colors">
                {firstName} {lastName}
              </h4>
              <AccountTierBadge tier={tier} showIcon={true} />
              {status !== "ACTIVE" && <AccountStatusBadge status={status} />}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {accountNumber}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-medium">{formatCurrency(annualSpend)}</p>
            <p className="text-xs text-muted-foreground">Annual Spend</p>
          </div>
          {enrollmentCount !== undefined && (
            <div className="text-right">
              <p className="text-sm font-medium">{enrollmentCount}</p>
              <p className="text-xs text-muted-foreground">Enrollments</p>
            </div>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </Link>
  );
}

