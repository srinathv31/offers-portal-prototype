import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getOfferWithCampaigns } from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";
import { EditOfferClient } from "./edit-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function EditOfferContent({ id }: { id: string }) {
  const offer = await getOfferWithCampaigns(id);

  if (!offer) {
    notFound();
  }

  const campaigns = offer.campaignOffers.map((co) => co.campaign);
  const liveCampaigns = campaigns.filter((c) => c.status === "LIVE");

  // Prepare initial values for the form
  const initialValues = {
    name: offer.name,
    type: offer.type,
    vendor: offer.vendor || "",
    parameters: (offer.parameters || {}) as Record<string, unknown>,
    hasProgressTracking: offer.hasProgressTracking,
    progressTarget: offer.progressTarget as {
      targetAmount?: number;
      category?: string;
      vendor?: string;
      timeframeDays?: number;
    } | null,
    effectiveFrom: offer.effectiveFrom
      ? new Date(offer.effectiveFrom).toISOString().split("T")[0]
      : "",
    effectiveTo: offer.effectiveTo
      ? new Date(offer.effectiveTo).toISOString().split("T")[0]
      : "",
  };

  return (
    <EditOfferClient
      offerId={id}
      initialValues={initialValues}
      liveCampaigns={liveCampaigns}
      allCampaigns={campaigns}
    />
  );
}

function EditOfferSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-12 w-96 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default async function EditOfferPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<EditOfferSkeleton />}>
      <EditOfferContent id={id} />
    </Suspense>
  );
}

