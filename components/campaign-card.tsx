"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { MetricKPI } from "@/components/metric-kpi";
import type { CampaignStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface CampaignMetrics {
  activations?: number;
  revenue?: number;
  projected_lift_pct?: number;
  error_rate_pct?: number;
}

interface CampaignCardProps {
  id: string;
  name: string;
  purpose: string;
  status: CampaignStatus;
  metrics: CampaignMetrics;
  className?: string;
}

export function CampaignCard({
  id,
  name,
  purpose,
  status,
  metrics,
  className,
}: CampaignCardProps) {
  return (
    <Link href={`/campaigns/${id}`} className="block group">
      <Card
        className={cn(
          "transition-all duration-200 hover:shadow-lg hover:border-primary/50 cursor-pointer",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {name}
            </CardTitle>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{purpose}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <MetricKPI
              label="Activations"
              value={metrics.activations || 0}
              tooltip="Number of customers who activated this campaign"
            />
            <MetricKPI
              label="Revenue"
              value={metrics.revenue || 0}
              tooltip="Total revenue generated from this campaign"
            />
            <MetricKPI
              label="Lift"
              value={`${(metrics.projected_lift_pct || 0).toFixed(1)}%`}
              tooltip="Projected or actual lift in customer engagement"
              trend={
                (metrics.projected_lift_pct || 0) > 15
                  ? "up"
                  : (metrics.projected_lift_pct || 0) < 10
                  ? "down"
                  : "neutral"
              }
            />
            <MetricKPI
              label="Error Rate"
              value={`${(metrics.error_rate_pct || 0).toFixed(2)}%`}
              tooltip="Percentage of errors during campaign execution"
              trend={
                (metrics.error_rate_pct || 0) < 1
                  ? "up"
                  : (metrics.error_rate_pct || 0) > 2
                  ? "down"
                  : "neutral"
              }
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

