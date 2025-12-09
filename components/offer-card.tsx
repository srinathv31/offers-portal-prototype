"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OfferTypeBadge } from "@/components/offer-type-badge";
import type { OfferType } from "@/lib/db/schema";
import { CheckCircle2 } from "lucide-react";

interface OfferCardProps {
  id: string;
  name: string;
  type: OfferType;
  vendor: string | null;
  parameters: Record<string, unknown>;
  campaignCount?: number;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function OfferCard({
  id,
  name,
  type,
  vendor,
  parameters,
  campaignCount = 0,
  selectable = false,
  selected = false,
  onSelect,
}: OfferCardProps) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(id);
    }
  };

  const content = (
    <Card
      className={`transition-all ${
        selectable
          ? `cursor-pointer hover:shadow-lg ${
              selected ? "border-primary ring-2 ring-primary" : "hover:border-primary"
            }`
          : "hover:shadow-md"
      }`}
      onClick={selectable ? handleClick : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{name}</CardTitle>
            {vendor && (
              <Badge variant="outline" className="mt-2">
                {vendor}
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <OfferTypeBadge type={type} />
            {selectable && selected && (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Display key parameters */}
          {type === "POINTS_MULTIPLIER" && parameters.multiplier != null && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{String(parameters.multiplier)}×</span> points
              {parameters.category != null && ` on ${String(parameters.category)}`}
            </p>
          )}
          {type === "CASHBACK" && parameters.cashbackPercent != null && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{String(parameters.cashbackPercent)}%</span> cashback
              {parameters.maxCashback != null && ` (max $${String(parameters.maxCashback)})`}
            </p>
          )}
          {type === "DISCOUNT" && parameters.discountPercent != null && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{String(parameters.discountPercent)}%</span> discount
            </p>
          )}
          {type === "BONUS" && parameters.bonusPoints != null && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{String(parameters.bonusPoints)}</span> bonus points
            </p>
          )}

          {!selectable && campaignCount > 0 && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Used in {campaignCount} campaign{campaignCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (selectable) {
    return content;
  }

  return <Link href={`/offers/${id}`}>{content}</Link>;
}

