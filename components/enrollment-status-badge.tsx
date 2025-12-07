import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EnrollmentStatus } from "@/lib/db/schema";
import { CheckCircle, Clock, PlayCircle, XCircle, Ban } from "lucide-react";

interface EnrollmentStatusBadgeProps {
  status: EnrollmentStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<
  EnrollmentStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  ENROLLED: {
    label: "Enrolled",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    icon: Clock,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    icon: PlayCircle,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    icon: CheckCircle,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    icon: XCircle,
  },
  OPTED_OUT: {
    label: "Opted Out",
    className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    icon: Ban,
  },
};

export function EnrollmentStatusBadge({
  status,
  className,
  showIcon = true,
}: EnrollmentStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn("font-medium gap-1", config.className, className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}

