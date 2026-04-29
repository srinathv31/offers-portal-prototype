import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WaveStatusBadge } from "@/components/wave-status-badge";
import { Users, TrendingUp, DollarSign, Calendar } from "lucide-react";
import type { CampaignWaveRow } from "@/lib/waves";
import type { WaveStats } from "@/lib/waves/projections";

interface WaveCardProps {
  wave: CampaignWaveRow;
  stats: WaveStats;
}

export function WaveCard({ wave, stats }: WaveCardProps) {
  const dateLabel =
    wave.startDate && wave.endDate
      ? `${format(wave.startDate, "MMM d")} → ${format(wave.endDate, "MMM d, yyyy")}`
      : "No dates set";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Wave {wave.sequence}</CardTitle>
          <div className="flex items-center gap-1.5">
            <WaveStatusBadge status={wave.status} />
            {stats.isProjected && (
              <Badge variant="outline" className="text-[10px] uppercase">
                Projected
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-2xl font-bold">
            {wave.rolloutPct.toFixed(0)}%
          </span>
          <span className="text-sm text-muted-foreground">of audience</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {wave.customerCount.toLocaleString()}
          </span>
          <span className="text-muted-foreground">customers</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{dateLabel}</span>
        </div>
        <div className="border-t pt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Activations
            </div>
            <div className="font-semibold">
              {stats.activations.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Revenue
            </div>
            <div className="font-semibold">
              ${(stats.revenue / 100).toLocaleString()}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-muted-foreground">
              {stats.isProjected ? "Projected lift" : "Avg lift (modeled)"}
            </div>
            <div className="font-semibold">
              {stats.avgLiftPct.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
