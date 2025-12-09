"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CreditCardProduct } from "@/lib/db/schema";
import { CreditCard } from "lucide-react";
import {
  creditCardProductColors,
  creditCardProductNames,
  getCreditCardProductName,
  getCreditCardProductDescription,
  getCreditCardProductColor,
} from "@/lib/credit-card-utils";

// Re-export utilities for backward compatibility
export { getCreditCardProductName, getCreditCardProductDescription, getCreditCardProductColor };

interface CreditCardProductBadgeProps {
  product: CreditCardProduct;
  showIcon?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function CreditCardProductBadge({
  product,
  showIcon = true,
  size = "default",
  className,
}: CreditCardProductBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        creditCardProductColors[product],
        size === "sm" ? "text-xs px-2 py-0" : "text-sm",
        className
      )}
    >
      {showIcon && (
        <CreditCard className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      )}
      {creditCardProductNames[product]}
    </Badge>
  );
}


