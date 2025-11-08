"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SimulationRun {
  id: string;
  campaignId: string;
  steps: Array<{
    key: string;
    label: string;
    status: "PENDING" | "RUNNING" | "DONE" | "FAIL";
  }>;
  projections?: {
    revenue?: number;
    errorRate?: number;
  };
  finished: boolean;
  success?: boolean;
  cohortSize?: number;
}

export default function TestRunnerPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    params.then((p) => setRunId(p.runId));
  }, [params]);

  useEffect(() => {
    if (!runId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/simulate/${runId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch simulation status");
        }
        const data = await response.json();
        setRun(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching simulation status:", error);
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [runId]);

  const handleDownload = () => {
    if (!runId) return;
    window.open(`/api/export-report/${runId}`, "_blank");
  };

  const handleStartNew = () => {
    const campaignId = searchParams.get("campaignId");
    if (campaignId) {
      router.push(`/testing/new?campaignId=${campaignId}`);
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

  const statusColors: Record<string, string> = {
    PENDING: "bg-gray-500",
    RUNNING: "bg-blue-500",
    DONE: "bg-green-500",
    FAIL: "bg-red-500",
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
          <h1 className="text-3xl font-bold mb-2">E2E Test Run</h1>
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
              <CardDescription>
                Step-by-step execution status
              </CardDescription>
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
                    <div className="flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-white border-0 ${statusColors[step.status]}`}
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
                      <div className="animate-spin">⟳</div>
                    )}
                    {step.status === "DONE" && (
                      <div className="text-green-500">✓</div>
                    )}
                    {step.status === "FAIL" && (
                      <div className="text-red-500">✗</div>
                    )}
                  </div>
                ))}
              </div>

              {run.finished && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="font-medium mb-2">
                    {run.success ? "✓ Test Completed Successfully" : "✗ Test Failed"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Simulation finished. You can download the report for detailed results.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Projections</CardTitle>
              <CardDescription>
                Estimated results from simulation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {run.cohortSize !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Cohort Size</div>
                  <div className="text-2xl font-bold">
                    {run.cohortSize.toLocaleString()}
                  </div>
                </div>
              )}

              {run.projections?.revenue !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Projected Revenue</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(run.projections.revenue / 1000).toFixed(0)}k
                  </div>
                </div>
              )}

              {run.projections?.errorRate !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                  <div
                    className={`text-2xl font-bold ${
                      run.projections.errorRate > 1
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {run.projections.errorRate.toFixed(2)}%
                  </div>
                </div>
              )}

              {!run.projections && !run.finished && (
                <div className="text-sm text-muted-foreground">
                  Projections will appear as the simulation progresses...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

