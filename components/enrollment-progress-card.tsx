"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EnrollmentStatusBadge } from "@/components/enrollment-status-badge";
import type { EnrollmentStatus, OfferType } from "@/lib/db/schema";
import { Calendar, Target, Gift } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentProgressCardProps {
  id: string;
  offerId: string;
  offerName: string;
  offerType: OfferType;
  status: EnrollmentStatus;
  enrolledAt: Date;
  expiresAt?: Date | null;
  targetAmount?: number | null; // in cents
  currentProgress: number; // in cents
  progressPct: string | number;
  rewardEarned?: number | null; // in cents
  completedAt?: Date | null;
  accountId?: string;
  showAccountLink?: boolean;
  accountName?: string;
  className?: string;
}

const offerTypeLabels: Record<OfferType, string> = {
  POINTS_MULTIPLIER: "Points Multiplier",
  CASHBACK: "Cashback",
  DISCOUNT: "Discount",
  BONUS: "Bonus",
};

const offerTypeColors: Record<OfferType, string> = {
  POINTS_MULTIPLIER: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  CASHBACK: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  DISCOUNT: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  BONUS: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function EnrollmentProgressCard({
  offerId,
  offerName,
  offerType,
  status,
  enrolledAt,
  expiresAt,
  targetAmount,
  currentProgress,
  progressPct,
  rewardEarned,
  accountId,
  showAccountLink,
  accountName,
  className,
}: EnrollmentProgressCardProps) {
  const progressValue = typeof progressPct === "string" ? parseFloat(progressPct) : progressPct;
  const hasTarget = targetAmount != null && targetAmount > 0;

  const content = (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-medium group-hover:text-primary transition-colors">
              {offerName}
            </h4>
            <Badge variant="secondary" className={cn("text-xs", offerTypeColors[offerType])}>
              {offerTypeLabels[offerType]}
            </Badge>
          </div>
          {showAccountLink && accountName && (
            <p className="text-sm text-muted-foreground">
              Account: {accountName}
            </p>
          )}
        </div>
        <EnrollmentStatusBadge status={status} />
      </div>

      {/* Progress Section */}
      {hasTarget && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Progress
            </span>
            <span className="font-medium">
              {formatCurrency(currentProgress)} / {formatCurrency(targetAmount)}
            </span>
          </div>
          <Progress value={Math.min(progressValue, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {progressValue.toFixed(1)}% complete
          </p>
        </div>
      )}

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Enrolled {format(new Date(enrolledAt), "MMM d, yyyy")}
          </span>
          {expiresAt && (
            <span>
              Expires {format(new Date(expiresAt), "MMM d, yyyy")}
            </span>
          )}
        </div>
        {status === "COMPLETED" && rewardEarned != null && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
            <Gift className="h-3 w-3" />
            {formatCurrency(rewardEarned)} earned
          </span>
        )}
      </div>
    </div>
  );

  if (showAccountLink && accountId) {
    return (
      <Link href={`/accounts/${accountId}`} className="block">
        {content}
      </Link>
    );
  }

  return (
    <Link href={`/offers/${offerId}`} className="block">
      {content}
    </Link>
  );
}

