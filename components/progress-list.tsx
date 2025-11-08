import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "PENDING" | "RUNNING" | "DONE" | "FAIL";

interface ProgressStep {
  key: string;
  label: string;
  status: StepStatus;
}

interface ProgressListProps {
  steps: ProgressStep[];
  className?: string;
}

export function ProgressList({ steps, className }: ProgressListProps) {
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case "RUNNING":
        return <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />;
      case "FAIL":
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "PENDING":
      default:
        return <Circle className="h-5 w-5 text-gray-400 dark:text-gray-600" />;
    }
  };

  const getStepTextColor = (status: StepStatus) => {
    switch (status) {
      case "DONE":
        return "text-green-900 dark:text-green-100";
      case "RUNNING":
        return "text-blue-900 dark:text-blue-100 font-medium";
      case "FAIL":
        return "text-red-900 dark:text-red-100";
      case "PENDING":
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  return (
    <ol className={cn("space-y-4", className)} role="list">
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium", getStepTextColor(step.status))}>
              {step.label}
            </p>
            {step.status === "RUNNING" && (
              <p className="text-xs text-muted-foreground mt-0.5">Processing...</p>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute left-[10px] top-[32px] h-[24px] w-px",
                step.status === "DONE" ? "bg-green-300" : "bg-gray-200 dark:bg-gray-700"
              )}
              style={{ position: "relative", left: "-32px", top: "8px" }}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

