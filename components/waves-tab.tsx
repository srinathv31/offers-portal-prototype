import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricKPI } from "@/components/metric-kpi";
import { WaveTimeline } from "@/components/wave-timeline";
import { WaveCard } from "@/components/wave-card";
import { WavePlanActions } from "@/components/wave-plan-actions";
import { Waves } from "lucide-react";
import { getCampaignWaves } from "@/lib/waves";
import { getAllWaveStats } from "@/lib/waves/projections";
import type { CampaignStatus } from "@/lib/db/schema";

interface WavesTabProps {
  campaignId: string;
  campaignStatus: CampaignStatus;
}

export async function WavesTab({
  campaignId,
  campaignStatus,
}: WavesTabProps) {
  const waves = await getCampaignWaves(campaignId);
  const stats = await getAllWaveStats(campaignId, campaignStatus, waves);

  const totalCustomers = waves.reduce((sum, w) => sum + w.customerCount, 0);
  const totalActivations = stats.reduce((sum, s) => sum + s.activations, 0);
  const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
  const isProjected = stats.every((s) => s.isProjected);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5" />
                Rollout Waves
                {isProjected && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (projected)
                  </span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Offers roll out in {waves.length} phases instead of all at once,
                so we can observe early performance before full audience.
              </p>
            </div>
            <WavePlanActions
              campaignId={campaignId}
              campaignStatus={campaignStatus}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricKPI
              label="Total customers"
              value={totalCustomers}
              tooltip="Sum of customers across all waves"
            />
            <MetricKPI
              label={isProjected ? "Projected activations" : "Activations"}
              value={totalActivations}
              tooltip={
                isProjected
                  ? "Modeled activations across all waves"
                  : "Actual enrollments bucketed by wave"
              }
            />
            <MetricKPI
              label={isProjected ? "Projected revenue" : "Revenue"}
              value={`$${(totalRevenue / 100).toLocaleString()}`}
              tooltip={
                isProjected
                  ? "Modeled revenue from projected activations"
                  : "Total reward earned across all wave enrollments"
              }
            />
          </div>

          {waves.length > 0 ? (
            <WaveTimeline waves={waves} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No wave plan yet. Click Regenerate to create one.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {waves.map((wave, idx) => (
          <WaveCard key={wave.id} wave={wave} stats={stats[idx]} />
        ))}
      </div>
    </div>
  );
}
