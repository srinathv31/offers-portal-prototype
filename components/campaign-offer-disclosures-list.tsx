"use client";

import { useState } from "react";
import { FileText, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DisclosureViewer } from "@/components/disclosure-viewer";
import { cn } from "@/lib/utils";
import type { OfferType } from "@/lib/db/schema";

const offerTypeColors: Record<OfferType, string> = {
  POINTS_MULTIPLIER:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CASHBACK:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DISCOUNT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  BONUS: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const mimeTypeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "text/plain": "TXT",
  "text/markdown": "MD",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface OfferWithDisclosuresForList {
  id: string;
  name: string;
  type: OfferType;
  vendor: string | null;
  disclosures: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }>;
}

interface CampaignOfferDisclosuresListProps {
  offers: OfferWithDisclosuresForList[];
  emptyMessage?: string;
}

export function CampaignOfferDisclosuresList({
  offers,
  emptyMessage = "No offers in this campaign yet.",
}: CampaignOfferDisclosuresListProps) {
  const [viewing, setViewing] = useState<{
    offerId: string;
    disclosureId: string;
    fileName: string;
  } | null>(null);

  if (offers.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const offersWithDisclosures = offers.filter(
    (o) => o.disclosures.length > 0
  );
  const offersWithoutDisclosures = offers.filter(
    (o) => o.disclosures.length === 0
  );
  const totalDisclosures = offers.reduce(
    (sum, o) => sum + o.disclosures.length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {offers.map((offer) => {
          const hasDisclosures = offer.disclosures.length > 0;
          return (
            <div
              key={offer.id}
              className={cn(
                "rounded-lg border overflow-hidden",
                hasDisclosures
                  ? "border-border"
                  : "border-amber-200 dark:border-amber-900"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-between p-3",
                  hasDisclosures
                    ? "bg-muted/30"
                    : "bg-amber-50/50 dark:bg-amber-950/30"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{offer.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", offerTypeColors[offer.type])}
                    >
                      {offer.type.replace(/_/g, " ")}
                    </Badge>
                    {offer.vendor && (
                      <span className="text-xs text-muted-foreground truncate">
                        {offer.vendor}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3 text-xs font-medium">
                  {hasDisclosures ? (
                    <span className="text-muted-foreground">
                      {offer.disclosures.length} disclosure
                      {offer.disclosures.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      No disclosure attached
                    </span>
                  )}
                </div>
              </div>

              {hasDisclosures && (
                <div className="divide-y">
                  {offer.disclosures.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 bg-card"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{d.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {mimeTypeLabels[d.mimeType] || d.mimeType} &middot;{" "}
                            {formatFileSize(d.fileSize)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 flex-shrink-0"
                        onClick={() =>
                          setViewing({
                            offerId: offer.id,
                            disclosureId: d.id,
                            fileName: d.fileName,
                          })
                        }
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
        <span>
          <span className="font-medium text-foreground">
            {offersWithDisclosures.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{offers.length}</span>{" "}
          offer{offers.length !== 1 ? "s" : ""} have disclosures
          {totalDisclosures > 0 && ` (${totalDisclosures} document${totalDisclosures !== 1 ? "s" : ""} total)`}
        </span>
      </div>

      {offersWithoutDisclosures.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {offersWithoutDisclosures.length} offer
            {offersWithoutDisclosures.length !== 1 ? "s" : ""} do not have a
            disclosure document attached. Customers enrolling in those offers
            will not see a disclosure.
          </AlertDescription>
        </Alert>
      )}

      {viewing && (
        <DisclosureViewer
          offerId={viewing.offerId}
          disclosureId={viewing.disclosureId}
          fileName={viewing.fileName}
          open={!!viewing}
          onOpenChange={(open) => {
            if (!open) setViewing(null);
          }}
        />
      )}
    </div>
  );
}
