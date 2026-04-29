"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  CampaignOfferDisclosuresList,
  type OfferWithDisclosuresForList,
} from "@/components/campaign-offer-disclosures-list";

interface DisclosurePreviewStepProps {
  offerIds: string[];
  onBack: () => void;
  onCreateCampaign: () => void;
  loading: boolean;
}

export function DisclosurePreviewStep({
  offerIds,
  onBack,
  onCreateCampaign,
  loading,
}: DisclosurePreviewStepProps) {
  const [selectedOffers, setSelectedOffers] = useState<
    OfferWithDisclosuresForList[]
  >([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      if (offerIds.length === 0) {
        setSelectedOffers([]);
        setLoadingOffers(false);
        return;
      }
      setLoadingOffers(true);
      try {
        const res = await fetch(`/api/offers/by-ids?ids=${offerIds.join(",")}`);
        if (!res.ok) {
          throw new Error("Failed to fetch offers");
        }
        const data: OfferWithDisclosuresForList[] = await res.json();
        setSelectedOffers(data);
      } catch (err) {
        console.error("Failed to fetch offers with disclosures:", err);
        setSelectedOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    };
    fetchOffers();
  }, [offerIds]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Review Offer Disclosures</CardTitle>
          </div>
          <CardDescription>
            Customers see the disclosure for the specific offer they enroll in.
            Confirm each offer in this campaign has its disclosure attached
            before creating the campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOffers ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <CampaignOfferDisclosuresList
              offers={selectedOffers}
              emptyMessage="No offers selected for this campaign yet."
            />
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suggestion
        </Button>
        <Button
          onClick={onCreateCampaign}
          disabled={loading}
          className="gap-2 flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Campaign...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Create Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
