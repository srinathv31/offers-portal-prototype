"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import type { StrategySuggestion } from "@/lib/ai/types";

type Step = "input" | "suggestion" | "review";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignPurpose, setCampaignPurpose] = useState("");
  const [season, setSeason] = useState("");
  const [suggestion, setSuggestion] = useState<StrategySuggestion | null>(null);

  const handleGetSuggestion = async () => {
    if (!campaignPurpose.trim()) {
      setError("Please enter a campaign objective");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: season || undefined,
          objective: campaignPurpose,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI suggestion");
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
      setStep("suggestion");

      // Apply hints
      if (data.suggestion.nameHint && !campaignName) {
        setCampaignName(data.suggestion.nameHint);
      }
      if (data.suggestion.purposeHint) {
        setCampaignPurpose(data.suggestion.purposeHint);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestion");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          purpose: campaignPurpose,
          suggestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }

      const data = await response.json();
      router.push(`/campaigns/${data.campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Create New Campaign</h1>
          <p className="text-muted-foreground mt-2">
            Design a new offers campaign with AI-powered strategy suggestions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step === "input" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === "input"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Input</span>
            </div>
            <Separator className="w-16" />
            <div
              className={`flex items-center gap-2 ${
                step === "suggestion" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === "suggestion"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">AI Suggestion</span>
            </div>
            <Separator className="w-16" />
            <div
              className={`flex items-center gap-2 ${
                step === "review" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step === "review"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Input */}
        {step === "input" && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Enter your campaign information and get AI-powered strategy suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g., Holiday Rewards Blitz"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Leave blank to get AI-generated name suggestions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Campaign Objective *</Label>
                <Textarea
                  id="objective"
                  placeholder="e.g., Drive holiday spending by offering enhanced rewards on popular retail partners"
                  value={campaignPurpose}
                  onChange={(e) => setCampaignPurpose(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Season / Timing (Optional)</Label>
                <Input
                  id="season"
                  placeholder="e.g., Holiday 2025, Summer, Q1 2026"
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Helps AI provide seasonally relevant suggestions
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleGetSuggestion}
                  disabled={loading || !campaignPurpose.trim()}
                  className="gap-2 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Suggestion...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get AI Suggestion
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("review")}
                  disabled={!campaignName.trim() || !campaignPurpose.trim()}
                >
                  Skip to Manual Creation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Suggestion */}
        {step === "suggestion" && suggestion && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>AI Strategy Suggestion</CardTitle>
                </div>
                <CardDescription>
                  Review the AI-generated campaign strategy and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {suggestion.nameHint && (
                  <div>
                    <Label className="text-muted-foreground">Suggested Name</Label>
                    <p className="text-lg font-semibold mt-1">{suggestion.nameHint}</p>
                  </div>
                )}

                {suggestion.purposeHint && (
                  <div>
                    <Label className="text-muted-foreground">Refined Purpose</Label>
                    <p className="mt-1">{suggestion.purposeHint}</p>
                  </div>
                )}

                <Separator />

                {/* Recommended Offers */}
                <div>
                  <Label className="text-lg font-semibold">
                    Recommended Offers ({suggestion.recommendedOffers.length})
                  </Label>
                  <div className="space-y-3 mt-3">
                    {suggestion.recommendedOffers.map((offer, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{offer.name}</h4>
                            {offer.vendor && (
                              <Badge variant="outline" className="mt-1">
                                {offer.vendor}
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">{offer.reasoning}</p>
                          </div>
                          <Badge variant="secondary">{offer.type.replace(/_/g, " ")}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Segments */}
                <div>
                  <Label className="text-lg font-semibold">
                    Target Segments ({suggestion.segments.length})
                  </Label>
                  <div className="grid gap-3 mt-3 sm:grid-cols-2">
                    {suggestion.segments.map((segment, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
                        <h4 className="font-medium">{segment.name}</h4>
                        <Badge variant="outline" className="mt-1">
                          {segment.source}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">{segment.criteria}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Channels */}
                <div>
                  <Label className="text-lg font-semibold">Recommended Channels</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestion.channels.map((channel) => (
                      <Badge key={channel} variant="secondary" className="text-sm">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                {suggestion.timelines && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-lg font-semibold">Suggested Timeline</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Start:</span>
                          <span className="font-medium">{suggestion.timelines.recommendedStart}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">End:</span>
                          <span className="font-medium">{suggestion.timelines.recommendedEnd}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {suggestion.timelines.rationale}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {suggestion.notes && suggestion.notes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-lg font-semibold">Strategic Notes</Label>
                      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                        {suggestion.notes.map((note, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("input")}>
                Back to Edit
              </Button>
              <Button onClick={handleCreateCampaign} disabled={loading} className="gap-2 flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Accept & Create Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

