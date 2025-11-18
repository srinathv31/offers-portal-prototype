import { Suspense } from "react";
import { getAllCampaignsGrouped } from "@/lib/db";
import { CampaignCard } from "@/components/campaign-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, ClipboardCheck, Archive } from "lucide-react";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  const grouped = await getAllCampaignsGrouped();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* POC Banner */}
      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <AlertDescription className="text-sm">
          <strong>POC Only:</strong> This is a prototype environment. All data is mocked for
          demonstration purposes.
        </AlertDescription>
      </Alert>

      {/* Live Campaigns */}
      {grouped.LIVE.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold">Live Campaigns</h2>
            <span className="text-sm text-muted-foreground">
              ({grouped.LIVE.length})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grouped.LIVE.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                purpose={campaign.purpose}
                status={campaign.status}
                metrics={campaign.metrics as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* In Review Campaigns */}
      {grouped.IN_REVIEW.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold">In Review</h2>
            <span className="text-sm text-muted-foreground">
              ({grouped.IN_REVIEW.length})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grouped.IN_REVIEW.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                purpose={campaign.purpose}
                status={campaign.status}
                metrics={campaign.metrics as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* Ended Campaigns */}
      {grouped.ENDED.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Archive className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h2 className="text-2xl font-bold">Ended Campaigns</h2>
            <span className="text-sm text-muted-foreground">
              ({grouped.ENDED.length})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {grouped.ENDED.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                purpose={campaign.purpose}
                status={campaign.status}
                metrics={campaign.metrics as any}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {grouped.LIVE.length === 0 &&
        grouped.IN_REVIEW.length === 0 &&
        grouped.ENDED.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Rocket className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No campaigns yet</h2>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first campaign
            </p>
          </div>
        )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-12 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold tracking-tight">Campaign Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your credit card offers campaigns
          </p>
        </div>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
