"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferTypeBadge } from "@/components/offer-type-badge";
import { DocumentLinkDialog } from "@/components/document-link-dialog";
import { CloneOfferDialog } from "@/components/clone-offer-dialog";
import type { OfferType } from "@/lib/db/schema";
import { CheckCircle2, Copy, FileText } from "lucide-react";

interface OfferCardProps {
  id: string;
  name: string;
  type: OfferType;
  vendor: string | null;
  parameters: Record<string, unknown>;
  campaignCount?: number;
  disclosureCount?: number;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onDisclosureUploaded?: () => void;
}

export function OfferCard({
  id,
  name,
  type,
  vendor,
  parameters,
  campaignCount = 0,
  disclosureCount = 0,
  selectable = false,
  selected = false,
  onSelect,
  onDisclosureUploaded,
}: OfferCardProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(id);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLinkDialogOpen(true);
  };

  const handleCloneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCloneDialogOpen(true);
  };

  const content = (
    <Card
      className={`h-full flex flex-col transition-all ${
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
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
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

          <div className="pt-2 border-t space-y-1.5">
            {!selectable && campaignCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Used in {campaignCount} campaign{campaignCount !== 1 ? "s" : ""}
              </p>
            )}
            <div className="flex items-center justify-between">
              {!selectable ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 text-xs gap-1 -ml-2 ${
                    disclosureCount > 0 ? "text-muted-foreground" : "text-amber-600 hover:text-amber-700"
                  }`}
                  onClick={handleLinkClick}
                >
                  <FileText
                    className={`h-3.5 w-3.5 ${disclosureCount > 0 ? "text-green-600" : ""}`}
                  />
                  {disclosureCount > 0
                    ? `${disclosureCount} disclosure${disclosureCount !== 1 ? "s" : ""}`
                    : "Add disclosure"}
                </Button>
              ) : disclosureCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-green-600" />
                  {disclosureCount} disclosure{disclosureCount !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                  <FileText className="h-3.5 w-3.5" />
                  No disclosure
                </span>
              )}
              {!selectable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs gap-1"
                  onClick={handleCloneClick}
                >
                  <Copy className="h-3 w-3" />
                  Clone
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (selectable) {
    return content;
  }

  return (
    <>
      <Link href={`/offers/${id}`}>{content}</Link>
      <DocumentLinkDialog
        offerId={id}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onLinked={() => onDisclosureUploaded?.()}
      />
      <CloneOfferDialog
        sourceOfferId={id}
        sourceOfferName={name}
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
      />
    </>
  );
}

