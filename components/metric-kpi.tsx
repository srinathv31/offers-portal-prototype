import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricKPIProps {
  label: string;
  value: string | number;
  tooltip?: string;
  className?: string;
  valueClassName?: string;
  trend?: "up" | "down" | "neutral";
}

export function MetricKPI({
  label,
  value,
  tooltip,
  className,
  valueClassName,
  trend,
}: MetricKPIProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      // Format large numbers with commas
      if (val > 999) {
        return val.toLocaleString();
      }
      // Format percentages
      if (label.toLowerCase().includes("rate") || label.toLowerCase().includes("%")) {
        return `${val.toFixed(2)}%`;
      }
      // Format currency
      if (label.toLowerCase().includes("revenue") || label.toLowerCase().includes("cost")) {
        return `$${val.toLocaleString()}`;
      }
      return val.toString();
    }
    return val;
  };

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-400",
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div
        className={cn(
          "text-2xl font-bold",
          trend && trendColors[trend],
          valueClassName
        )}
      >
        {formatValue(value)}
      </div>
    </div>
  );
}

