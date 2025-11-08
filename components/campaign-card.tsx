"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CampaignStatus = "DRAFT" | "IN_REVIEW" | "TESTING" | "LIVE" | "ENDED";

interface CampaignCardProps {
  id: string;
  name: string;
  purpose: string;
  status: CampaignStatus;
  metrics: {
    activations?: number;
    revenue?: number;
    projectedLiftPct?: number;
    errorRatePct?: number;
  };
}

const statusColors: Record<CampaignStatus, string> = {
  DRAFT: "bg-gray-500",
  IN_REVIEW: "bg-yellow-500",
  TESTING: "bg-blue-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-400",
};

const statusLabels: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  TESTING: "Testing",
  LIVE: "Live",
  ENDED: "Ended",
};

export function CampaignCard({ id, name, purpose, status, metrics }: CampaignCardProps) {
  return (
    <Link href={`/campaigns/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{name}</CardTitle>
            <Badge
              variant="outline"
              className={cn("text-white border-0", statusColors[status])}
            >
              {statusLabels[status]}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">{purpose}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {metrics.activations !== undefined && (
              <div>
                <div className="text-muted-foreground">Activations</div>
                <div className="font-semibold">{metrics.activations.toLocaleString()}</div>
              </div>
            )}
            {metrics.revenue !== undefined && (
              <div>
                <div className="text-muted-foreground">Revenue</div>
                <div className="font-semibold">${(metrics.revenue / 1000).toFixed(0)}k</div>
              </div>
            )}
            {metrics.projectedLiftPct !== undefined && (
              <div>
                <div className="text-muted-foreground">Projected Lift</div>
                <div className="font-semibold text-green-600">{metrics.projectedLiftPct.toFixed(1)}%</div>
              </div>
            )}
            {metrics.errorRatePct !== undefined && (
              <div>
                <div className="text-muted-foreground">Error Rate</div>
                <div className={cn(
                  "font-semibold",
                  metrics.errorRatePct > 1 ? "text-red-600" : "text-green-600"
                )}>
                  {metrics.errorRatePct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

