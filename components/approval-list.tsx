import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ApprovalDecision } from "@/lib/db/schema";

interface Approval {
  id: string;
  role: string;
  decision: ApprovalDecision;
  actor?: string | null;
  timestamp?: Date | null;
}

interface ApprovalListProps {
  approvals: Approval[];
  className?: string;
}

const decisionConfig: Record<
  ApprovalDecision,
  { icon: React.ReactNode; label: string; className: string }
> = {
  APPROVED: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Approved",
    className: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950",
  },
  REJECTED: {
    icon: <XCircle className="h-5 w-5" />,
    label: "Rejected",
    className: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  },
  PENDING: {
    icon: <Clock className="h-5 w-5" />,
    label: "Pending",
    className: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950",
  },
};

export function ApprovalList({ approvals, className }: ApprovalListProps) {
  const approvedCount = approvals.filter((a) => a.decision === "APPROVED").length;
  const rejectedCount = approvals.filter((a) => a.decision === "REJECTED").length;
  const pendingCount = approvals.filter((a) => a.decision === "PENDING").length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Status:</span>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          {approvedCount} Approved
        </Badge>
        {rejectedCount > 0 && (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            {rejectedCount} Rejected
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {approvals.map((approval) => {
          const config = decisionConfig[approval.decision];
          return (
            <div
              key={approval.id}
              className={cn(
                "flex flex-col gap-2 p-4 rounded-lg border",
                config.className
              )}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{approval.role}</p>
                </div>
              </div>

              {approval.actor && (
                <div className="flex items-center gap-1.5 text-xs opacity-75">
                  <User className="h-3 w-3" />
                  <span className="truncate">{approval.actor}</span>
                </div>
              )}

              {approval.timestamp && (
                <div className="text-xs opacity-75">
                  {format(new Date(approval.timestamp), "MMM d, yyyy 'at' h:mm a")}
                </div>
              )}

              <Badge
                variant="outline"
                className={cn("self-start border-current mt-1", config.className)}
              >
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

