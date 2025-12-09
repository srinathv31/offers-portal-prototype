import { Badge } from "@/components/ui/badge";
import type { OfferType } from "@/lib/db/schema";

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

interface OfferTypeBadgeProps {
  type: OfferType;
  className?: string;
}

export function OfferTypeBadge({ type, className }: OfferTypeBadgeProps) {
  return (
    <Badge variant="secondary" className={`${offerTypeColors[type]} ${className || ""}`}>
      {offerTypeLabels[type]}
    </Badge>
  );
}

