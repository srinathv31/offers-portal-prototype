/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountProjectionsTable } from "@/components/account-projections-table";
import type { AccountProjection, SimulationType } from "@/lib/db/schema";

interface SimulationRun {
  id: string;
  campaignId: string;
  simulationType?: SimulationType;
  spendingGroupId?: string | null;
  inputs: Record<string, any>;
  cohortSize: number;
  projections: {
    // E2E Test projections
    revenue?: number;
    activations?: number;
    error_rate_pct?: number;
    // Spend Stim projections
    accountProjections?: AccountProjection[];
    totalCurrentSpend?: number;
    totalProjectedSpend?: number;
    avgLiftPct?: number;
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

export default function TestRunnerPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then((p) => setRunId(p.runId));
  }, [params]);

  useEffect(() => {
    if (!runId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/simulate/status?runId=${runId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch simulation status");
        }
        const data = await response.json();
        setRun(data.run);
        setLoading(false);

        // Stop polling if simulation is finished
        if (data.run?.finished && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (error) {
        console.error("Error fetching simulation status:", error);
        setLoading(false);
      }
    };

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 1000); // Poll every 1 second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [runId]);

  const handleDownload = async () => {
    if (!runId) return;
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
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  const handleStartNew = () => {
    const campaignId = searchParams.get("campaignId");
    if (campaignId) {
      router.push(`/campaigns/${campaignId}`);
    } else {
      router.push("/");
    }
  };

  if (loading || !run) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const completedSteps = run.steps.filter((s) => s.status === "DONE").length;
  const totalSteps = run.steps.length;
  const progress = (completedSteps / totalSteps) * 100;
  
  // Check if this is a Spend Stim simulation
  const isSpendStim = run.simulationType === "SPEND_STIM";
  const accountProjections = run.projections?.accountProjections || [];

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-500",
    RUNNING: "bg-blue-500",
    DONE: "bg-green-500",
    FAIL: "bg-red-500",
  };
  
  // Helper to format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">
              {isSpendStim ? "Spend Stim Simulation" : "E2E Test Run"}
            </h1>
            {isSpendStim && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Spend Stim
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Simulation Run ID: {run.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStartNew}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Start New Test
          </Button>
          {run.finished && (
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Progress</CardTitle>
              <CardDescription>Step-by-step execution status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps} / {totalSteps} steps
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-2">
                {run.steps.map((step, index) => (
                  <div
                    key={step.key}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-white border-0 ${
                          statusColors[step.status]
                        }`}
                      >
                        {index + 1}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.status}
                      </div>
                    </div>
                    {step.status === "RUNNING" && (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                    )}
                    {step.status === "DONE" && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {step.status === "FAIL" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                ))}
              </div>

              {run.finished && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    {run.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Test Completed Successfully
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        Test Failed
                      </>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Simulation finished. You can download the report for
                    detailed results.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isSpendStim ? (
                  <>
                    <DollarSign className="h-5 w-5" />
                    Spend Projections
                  </>
                ) : (
                  "Projections"
                )}
              </CardTitle>
              <CardDescription>
                {isSpendStim
                  ? "Projected spending activity"
                  : "Estimated results from simulation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {run.cohortSize !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    {isSpendStim ? "Accounts Analyzed" : "Cohort Size"}
                  </div>
                  <div className="text-2xl font-bold">
                    {run.cohortSize.toLocaleString()}
                  </div>
                </div>
              )}

              {isSpendStim ? (
                <>
                  {/* Spend Stim specific metrics */}
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Current Monthly Spend
                    </div>
                    {run.projections?.totalCurrentSpend !== undefined ? (
                      <div className="text-2xl font-bold">
                        {formatCurrency(run.projections.totalCurrentSpend)}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Projected Monthly Spend
                    </div>
                    {run.projections?.totalProjectedSpend !== undefined ? (
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(run.projections.totalProjectedSpend)}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Average Lift
                    </div>
                    {run.projections?.avgLiftPct !== undefined ? (
                      <div className="flex items-center gap-1">
                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {run.projections.avgLiftPct.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Projected Revenue Lift
                    </div>
                    {run.projections?.revenue !== undefined ? (
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        +{formatCurrency(run.projections.revenue)}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* E2E Test metrics */}
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Projected Revenue
                    </div>
                    {run.projections?.revenue !== undefined ? (
                      <div className="text-2xl font-bold text-green-600">
                        ${run.projections.revenue.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Projected Activations
                    </div>
                    {run.projections?.activations !== undefined ? (
                      <div className="text-2xl font-bold">
                        {run.projections.activations.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                    {run.projections?.error_rate_pct !== undefined ? (
                      <div
                        className={`text-2xl font-bold ${
                          run.projections.error_rate_pct > 1
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {run.projections.error_rate_pct.toFixed(2)}%
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground flex items-center gap-2">
                        {!run.finished ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Calculating...</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Projections Table for Spend Stim simulations */}
      {isSpendStim && accountProjections.length > 0 && (
        <div className="mt-6">
          <AccountProjectionsTable projections={accountProjections} />
        </div>
      )}
    </div>
  );
}
