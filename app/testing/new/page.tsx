"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function NewTestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const campaignId = searchParams.get("campaignId");

  const handleStartTest = async () => {
    if (!campaignId) {
      alert("Campaign ID is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });

      if (!response.ok) {
        throw new Error("Failed to start simulation");
      }

      const data = await response.json();
      router.push(`/testing/${data.runId}?campaignId=${campaignId}`);
    } catch (error) {
      console.error("Error starting test:", error);
      alert("Failed to start test");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Start E2E Test</CardTitle>
          <CardDescription>
            Run an end-to-end simulation for this campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaignId ? (
            <>
              <p className="text-sm text-muted-foreground">
                This will start a comprehensive simulation that tests all aspects
                of the campaign including rules compilation, data availability,
                channel presentment, disposition, and fulfillment.
              </p>
              <Button onClick={handleStartTest} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Test...
                  </>
                ) : (
                  "Start E2E Test"
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No campaign ID provided
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

