"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OfferType } from "@/lib/db/schema";
import { ChevronRight } from "lucide-react";

interface OfferListItemProps {
  id: string;
  name: string;
  type: OfferType;
  vendor?: string | null;
  className?: string;
  onClick?: () => void;
}

const offerTypeLabels: Record<OfferType, string> = {
  POINTS_MULTIPLIER: "Points Multiplier",
  CASHBACK: "Cashback",
  DISCOUNT: "Discount",
  BONUS: "Bonus",
};

const offerTypeColors: Record<OfferType, string> = {
  POINTS_MULTIPLIER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  CASHBACK: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  DISCOUNT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  BONUS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
};

export function OfferListItem({
  id,
  name,
  type,
  vendor,
  className,
  onClick,
}: OfferListItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors group cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
            {name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className={cn("text-xs", offerTypeColors[type])}>
              {offerTypeLabels[type]}
            </Badge>
            {vendor && (
              <span className="text-xs text-muted-foreground">
                · {vendor}
              </span>
            )}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </div>
  );

  if (onClick) {
    return content;
  }

  return <Link href={`/offers/${id}`}>{content}</Link>;
}

