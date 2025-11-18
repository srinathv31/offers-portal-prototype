import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/db/schema";

interface StatusBadgeProps {
  status: CampaignStatus;
  className?: string;
}

const statusConfig: Record<
  CampaignStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  TESTING: {
    label: "Testing",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  },
  LIVE: {
    label: "Live",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  },
  ENDED: {
    label: "Ended",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
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

