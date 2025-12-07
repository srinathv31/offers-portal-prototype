import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/lib/db/schema";

interface AccountStatusBadgeProps {
  status: AccountStatus;
  className?: string;
}

const statusConfig: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  },
  CLOSED: {
    label: "Closed",
    className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
};

export function AccountStatusBadge({
  status,
  className,
}: AccountStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

