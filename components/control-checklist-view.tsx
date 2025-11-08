import { CheckCircle2, AlertTriangle, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ControlResult } from "@/lib/db/schema";

interface ControlChecklistItem {
  name: string;
  result: ControlResult;
  evidence_ref?: string;
}

interface ControlChecklistViewProps {
  items: ControlChecklistItem[];
  className?: string;
}

const resultConfig: Record<
  ControlResult,
  { icon: React.ReactNode; label: string; className: string }
> = {
  PASS: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Pass",
    className: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950",
  },
  WARN: {
    icon: <AlertTriangle className="h-5 w-5" />,
    label: "Warning",
    className: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
  },
  FAIL: {
    icon: <XCircle className="h-5 w-5" />,
    label: "Fail",
    className: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  },
};

export function ControlChecklistView({
  items,
  className,
}: ControlChecklistViewProps) {
  const passCount = items.filter((item) => item.result === "PASS").length;
  const warnCount = items.filter((item) => item.result === "WARN").length;
  const failCount = items.filter((item) => item.result === "FAIL").length;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Summary:</span>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          {passCount} Passed
        </Badge>
        {warnCount > 0 && (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            {warnCount} Warnings
          </Badge>
        )}
        {failCount > 0 && (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            {failCount} Failed
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const config = resultConfig[item.result];
          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                config.className
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.evidence_ref && (
                    <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                      <FileText className="h-3 w-3" />
                      <span>{item.evidence_ref}</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("ml-2 border-current", config.className)}
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

