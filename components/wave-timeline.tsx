import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { WaveStatus } from "@/lib/db/schema";
import type { CampaignWaveRow } from "@/lib/waves";

interface WaveTimelineProps {
  waves: CampaignWaveRow[];
}

const segmentColor: Record<WaveStatus, string> = {
  PENDING: "bg-slate-300 dark:bg-slate-700",
  ACTIVE: "bg-green-500 dark:bg-green-600",
  COMPLETED: "bg-blue-400 dark:bg-blue-700",
};

export function WaveTimeline({ waves }: WaveTimelineProps) {
  if (waves.length === 0) return null;

  const hasDates = waves[0].startDate && waves[waves.length - 1].endDate;

  return (
    <div className="space-y-3">
      <div className="flex w-full overflow-hidden rounded-md border h-8">
        {waves.map((wave, idx) => (
          <div
            key={wave.id}
            className={cn(
              "flex items-center justify-center text-xs font-semibold text-white transition-all",
              segmentColor[wave.status],
              idx > 0 && "border-l border-white/30"
            )}
            style={{ width: `${wave.rolloutPct}%` }}
            title={`Wave ${wave.sequence}: ${wave.rolloutPct}% (${wave.customerCount} customers)`}
          >
            {wave.rolloutPct >= 8 ? `${wave.rolloutPct.toFixed(0)}%` : ""}
          </div>
        ))}
      </div>
      {hasDates && (
        <div className="flex w-full text-[11px] text-muted-foreground">
          {waves.map((wave) => (
            <div
              key={wave.id}
              className="flex flex-col items-start"
              style={{ width: `${wave.rolloutPct}%` }}
            >
              <span className="truncate">
                {wave.startDate ? format(wave.startDate, "MMM d") : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
