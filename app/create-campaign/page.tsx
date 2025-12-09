import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateCampaignPageContent } from "./create-campaign-content";

function CreateCampaignPageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CreateCampaignPage() {
  return (
    <Suspense fallback={<CreateCampaignPageSkeleton />}>
      <CreateCampaignPageContent />
    </Suspense>
  );
}
