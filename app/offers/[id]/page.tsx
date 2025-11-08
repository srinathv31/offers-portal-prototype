import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOfferWithCampaigns } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import type { OfferType } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
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

async function OfferDetailContent({ id }: { id: string }) {
  const offer = await getOfferWithCampaigns(id);

  if (!offer) {
    notFound();
  }

  const campaigns = offer.campaignOffers.map((co) => co.campaign);
  const parameters = (offer.parameters || {}) as Record<string, any>;

  // Find most recent completed campaign for performance data
  const liveCampaigns = campaigns.filter((c) => c.status === "LIVE");
  const endedCampaigns = campaigns.filter((c) => c.status === "ENDED");
  const lastCampaign = liveCampaigns[0] || endedCampaigns[0];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold tracking-tight">{offer.name}</h1>
                <Badge variant="secondary" className={offerTypeColors[offer.type]}>
                  {offerTypeLabels[offer.type]}
                </Badge>
                {offer.vendor && (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {offer.vendor}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Used in {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Offer Parameters */}
        <Card>
          <CardHeader>
            <CardTitle>Offer Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(parameters).length > 0 ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                {Object.entries(parameters).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="text-lg font-semibold">
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : Array.isArray(value)
                        ? value.join(", ")
                        : value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No parameters defined for this offer
              </p>
            )}
          </CardContent>
        </Card>

        {/* Last Campaign Performance */}
        {lastCampaign && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Last Campaign Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Link
                  href={`/campaigns/${lastCampaign.id}`}
                  className="text-lg font-medium hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  {lastCampaign.name}
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{lastCampaign.purpose}</p>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">
                    ${((lastCampaign.metrics as any)?.revenue || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activations</p>
                  <p className="text-2xl font-bold">
                    {((lastCampaign.metrics as any)?.activations || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-2xl font-bold">
                    {((lastCampaign.metrics as any)?.error_rate_pct || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Lineage */}
        <Card>
          <CardHeader>
            <CardTitle>Used in Campaigns ({campaigns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length > 0 ? (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="block p-4 rounded-lg border bg-card hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {campaign.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {campaign.purpose}
                        </p>
                        {campaign.startDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Started: {format(new Date(campaign.startDate), "MMM d, yyyy")}
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
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                This offer has not been used in any campaigns yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Offer Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="text-sm mt-1">
                  {format(new Date(offer.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                <dd className="text-sm mt-1">
                  {format(new Date(offer.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                </dd>
              </div>
              {offer.effectiveFrom && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Effective From</dt>
                  <dd className="text-sm mt-1">
                    {format(new Date(offer.effectiveFrom), "MMM d, yyyy")}
                  </dd>
                </div>
              )}
              {offer.effectiveTo && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Effective To</dt>
                  <dd className="text-sm mt-1">
                    {format(new Date(offer.effectiveTo), "MMM d, yyyy")}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OfferDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-12 w-96 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default async function OfferDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<OfferDetailSkeleton />}>
      <OfferDetailContent id={id} />
    </Suspense>
  );
}

