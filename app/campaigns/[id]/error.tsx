"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function CampaignError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Campaign error:", error);
  }, [error]);

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <CardTitle>Failed to Load Campaign</CardTitle>
            </div>
            <CardDescription>
              There was an error loading this campaign. It may not exist or there may be a connection issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error.message && (
              <div className="p-3 rounded-lg bg-muted text-sm font-mono">
                {error.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={reset} variant="default" className="gap-2 flex-1">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="gap-2 w-full">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

