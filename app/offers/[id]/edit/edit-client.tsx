"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OfferForm } from "@/components/offer-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import type { OfferType } from "@/lib/db/schema";

interface Campaign {
  id: string;
  name: string;
  status: string;
  purpose?: string;
}

interface EditOfferClientProps {
  offerId: string;
  initialValues: {
    name: string;
    type: OfferType;
    vendor: string;
    parameters: Record<string, unknown>;
    hasProgressTracking: boolean;
    progressTarget: {
      targetAmount?: number;
      category?: string;
      vendor?: string;
      timeframeDays?: number;
    } | null;
    effectiveFrom: string;
    effectiveTo: string;
  };
  liveCampaigns: Campaign[];
  allCampaigns: Campaign[];
}

export function EditOfferClient({
  offerId,
  initialValues,
  liveCampaigns,
  allCampaigns,
}: EditOfferClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    name: string;
    type: string;
    vendor?: string | null;
    parameters: Record<string, unknown>;
    hasProgressTracking: boolean;
    progressTarget?: {
      targetAmount?: number;
      category?: string;
      vendor?: string;
      timeframeDays?: number;
    } | null;
    effectiveFrom?: string;
    effectiveTo?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update offer");
      }

      router.push(`/offers/${offerId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update offer");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/offers/${offerId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Offer Details
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Edit Offer</h1>
          <p className="text-muted-foreground mt-2">
            Make changes to this offer
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Warning for LIVE campaigns */}
        {liveCampaigns.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This offer is currently used in{" "}
              {liveCampaigns.length} LIVE campaign{liveCampaigns.length !== 1 ? "s" : ""}.
              Changes may affect active campaigns.
            </AlertDescription>
          </Alert>
        )}

        {/* Campaign Usage */}
        {allCampaigns.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Campaign Usage ({allCampaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allCampaigns.slice(0, 5).map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {campaign.name}
                      </p>
                      {campaign.purpose && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {campaign.purpose}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          campaign.status === "LIVE"
                            ? "default"
                            : campaign.status === "ENDED"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
                {allCampaigns.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    And {allCampaigns.length - 5} more...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <OfferForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Update Offer"
          loading={loading}
        />
      </div>
    </div>
  );
}

