"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OfferType } from "@/lib/db/schema";

interface OfferDisclosureStatusCardProps {
  offerName: string;
  offerType: OfferType;
  vendor: string | null;
  disclosureCount: number;
}

const offerTypeColors: Record<OfferType, string> = {
  POINTS_MULTIPLIER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CASHBACK: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DISCOUNT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  BONUS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function OfferDisclosureStatusCard({
  offerName,
  offerType,
  vendor,
  disclosureCount,
}: OfferDisclosureStatusCardProps) {
  const hasDisclosures = disclosureCount > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
        hasDisclosures
          ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
          : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
            hasDisclosures
              ? "bg-green-100 dark:bg-green-900"
              : "bg-amber-100 dark:bg-amber-900"
          )}
        >
          {hasDisclosures ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{offerName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className={cn("text-xs", offerTypeColors[offerType])}>
              {offerType.replace(/_/g, " ")}
            </Badge>
            {vendor && (
              <span className="text-xs text-muted-foreground truncate">
                {vendor}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">
        {hasDisclosures ? (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            {disclosureCount} disclosure{disclosureCount !== 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            No disclosures
          </span>
        )}
      </div>
    </div>
  );
}
