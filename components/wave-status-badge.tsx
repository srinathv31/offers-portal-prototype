import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WaveStatus } from "@/lib/db/schema";

interface WaveStatusBadgeProps {
  status: WaveStatus;
  className?: string;
}

const statusConfig: Record<
  WaveStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className:
      "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  },
  ACTIVE: {
    label: "Active",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
};

export function WaveStatusBadge({ status, className }: WaveStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
