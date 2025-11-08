"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressList } from "@/components/progress-list";
import { MetricKPI } from "@/components/metric-kpi";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface SimulationRun {
  id: string;
  campaignId: string;
  inputs: Record<string, any>;
  cohortSize: number;
  projections: {
    revenue?: number;
    activations?: number;
    error_rate_pct?: number;
  };
  steps: Array<{
    key: string;
    label: string;
    status: "PENDING" | "RUNNING" | "DONE" | "FAIL";
  }>;
  finished: boolean;
  success: boolean;
  errors: Array<{ message: string; step?: string }>;
  startedAt: Date;
  finishedAt?: Date | null;
}

interface PageProps {
  params: Promise<{ runId: string }>;
}

export default function TestRunnerPage({ params }: PageProps) {
  const { runId } = use(params);
  const router = useRouter();
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRunStatus = async () => {
    try {
      const response = await fetch(`/api/simulate/status?runId=${runId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch simulation status");
      }
      const data = await response.json();
      setRun(data.run);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunStatus();

    // Poll every 2 seconds if not finished
    const interval = setInterval(() => {
      if (!run?.finished) {
        fetchRunStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [runId, run?.finished]);

  const handleDownloadReport = async () => {
    try {
      const response = await fetch(`/api/export-report?runId=${runId}`);
      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `simulation-report-${runId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to download report"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-12 w-96" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen">
        <div className="border-b">
          <div className="container mx-auto px-4 py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">
              Simulation Test
            </h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Simulation run not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link
            href={`/campaigns/${run.campaignId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaign
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  E2E Simulation Test
                </h1>
                {run.finished && (
                  <Badge
                    variant={run.success ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {run.success ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Failed
                      </>
                    )}
                  </Badge>
                )}
                {!run.finished && (
                  <Badge variant="secondary" className="text-sm animate-pulse">
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Running
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">Run ID: {run.id}</p>
            </div>
            {run.finished && (
              <Button onClick={handleDownloadReport} className="gap-2">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Panel: Projections & Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Projected Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricKPI
                    label="Revenue"
                    value={run.projections.revenue || 0}
                    tooltip="Projected revenue from this campaign"
                  />
                  <MetricKPI
                    label="Activations"
                    value={run.projections.activations || 0}
                    tooltip="Projected number of customer activations"
                  />
                  <MetricKPI
                    label="Error Rate"
                    value={`${(run.projections.error_rate_pct || 0).toFixed(
                      2
                    )}%`}
                    tooltip="Projected error rate"
                    trend={
                      (run.projections.error_rate_pct || 0) < 1
                        ? "up"
                        : (run.projections.error_rate_pct || 0) > 2
                        ? "down"
                        : "neutral"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test Inputs */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Cohort Size
                    </dt>
                    <dd className="text-lg font-semibold mt-1">
                      {run.cohortSize?.toLocaleString()}
                    </dd>
                  </div>
                  {run.inputs.testPercentage && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Test Percentage
                      </dt>
                      <dd className="text-lg font-semibold mt-1">
                        {run.inputs.testPercentage}%
                      </dd>
                    </div>
                  )}
                  {run.inputs.duration && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Duration
                      </dt>
                      <dd className="text-lg font-semibold mt-1">
                        {run.inputs.duration}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Errors (if any) */}
            {run.errors.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Errors ({run.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {run.errors.map((error, idx) => (
                      <Alert key={idx} variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          {error.step && <strong>{error.step}: </strong>}
                          {error.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel: Progress Steps */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Simulation Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressList steps={run.steps} />

                {run.finished && run.success && (
                  <div className="mt-6 pt-6 border-t">
                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        Simulation completed successfully with no errors.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
