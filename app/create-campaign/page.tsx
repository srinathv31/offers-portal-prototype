"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import type { StrategySuggestion } from "@/lib/ai/types";
import type { OfferType } from "@/lib/db/schema";
import { getCurrentSeason } from "@/lib/ai/strategy";
import { OfferCard } from "@/components/offer-card";

type Step = "choice" | "input" | "suggestion" | "manual";
type WorkflowMode = "ai-assisted" | "manual" | null;

interface Offer {
  id: string;
  name: string;
  type: OfferType;
  vendor: string | null;
  parameters: Record<string, unknown>;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choice");
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignPurpose, setCampaignPurpose] = useState("");
  const [season, setSeason] = useState(getCurrentSeason());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<StrategySuggestion | null>(null);

  // Offer selection state
  const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Fetch available offers
  useEffect(() => {
    const fetchOffers = async () => {
      setLoadingOffers(true);
      try {
        const res = await fetch("/api/offers");
        const data = await res.json();
        setAvailableOffers(data);
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setLoadingOffers(false);
      }
    };

    if (step === "manual" || step === "suggestion") {
      fetchOffers();
    }
  }, [step]);

  const toggleOfferSelection = (offerId: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(offerId)
        ? prev.filter((id) => id !== offerId)
        : [...prev, offerId]
    );
  };

  const handleAIAssistedChoice = async () => {
    setWorkflowMode("ai-assisted");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: season || undefined,
          objective: campaignPurpose || "",
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
      if (data.suggestion.purposeHint && !campaignPurpose) {
        setCampaignPurpose(data.suggestion.purposeHint);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestion");
      setStep("input"); // Go back to input on error
    } finally {
      setLoading(false);
    }
  };

  const handleManualChoice = () => {
    setWorkflowMode("manual");
    setStep("manual");
  };

  const handleGetSuggestion = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          season: season || undefined,
          objective: campaignPurpose || "",
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
      if (data.suggestion.purposeHint && !campaignPurpose) {
        setCampaignPurpose(data.suggestion.purposeHint);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestion");
      setStep("input"); // Go back to input on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualCampaign = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          purpose: campaignPurpose,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          channels: selectedChannels.length > 0 ? selectedChannels : undefined,
          offerIds: selectedOfferIds.length > 0 ? selectedOfferIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }

      const data = await response.json();
      router.push(`/campaigns/${data.campaignId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create campaign"
      );
      setLoading(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
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
          offerIds: selectedOfferIds.length > 0 ? selectedOfferIds : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create campaign");
      }

      const data = await response.json();
      router.push(`/campaigns/${data.campaignId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create campaign"
      );
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
          <h1 className="text-4xl font-bold tracking-tight">
            Create New Campaign
          </h1>
          <p className="text-muted-foreground mt-2">
            Design a new offers campaign with AI-powered strategy suggestions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Workflow Choice Screen */}
        {step === "choice" && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Your Workflow</h2>
              <p className="text-muted-foreground">
                How would you like to create your campaign?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* AI-Assisted Option */}
              <Card className="relative hover:shadow-lg transition-all duration-200 hover:border-primary cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">AI-Assisted</CardTitle>
                  </div>
                  <Badge className="absolute top-4 right-4 bg-primary">
                    Recommended
                  </Badge>
                  <CardDescription className="text-base">
                    Let AI generate a comprehensive campaign strategy based on
                    current season and best practices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Auto-generates seasonal offers and segments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Suggests optimal channels and timeline</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>You can refine and regenerate suggestions</span>
                    </li>
                  </ul>
                  <Button
                    onClick={handleAIAssistedChoice}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Start with AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Option */}
              <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                      <Pencil className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">Manual Creation</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Create a campaign from scratch with complete control over
                    all details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Enter campaign name and purpose</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Set dates and select channels</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Add offers and segments later</span>
                    </li>
                  </ul>
                  <Button
                    onClick={handleManualChoice}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Create Manually
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step Indicator (only show for AI-assisted workflow) */}
        {workflowMode === "ai-assisted" && step !== "choice" && (
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
                  step === "suggestion"
                    ? "text-primary"
                    : "text-muted-foreground"
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
            </div>
          </div>
        )}

        {error && step !== "choice" && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Manual Creation Form */}
        {step === "manual" && (
          <Card>
            <CardHeader>
              <CardTitle>Create Campaign Manually</CardTitle>
              <CardDescription>
                Enter your campaign details. You can add offers and segments
                from the campaign detail page after creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="manual-name">Campaign Name *</Label>
                <Input
                  id="manual-name"
                  placeholder="e.g., Q1 Growth Initiative"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-purpose">Campaign Purpose *</Label>
                <Textarea
                  id="manual-purpose"
                  placeholder="Describe the goals and objectives of this campaign..."
                  value={campaignPurpose}
                  onChange={(e) => setCampaignPurpose(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date (Optional)</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Marketing Channels (Optional)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["EMAIL", "MOBILE", "WEB", "SMS"].map((channel) => (
                    <div
                      key={channel}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedChannels.includes(channel)
                          ? "border-primary bg-primary/10"
                          : "hover:border-muted-foreground/50"
                      }`}
                      onClick={() => toggleChannel(channel)}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedChannels.includes(channel)
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {selectedChannels.includes(channel) && (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{channel}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Select the channels where this campaign will be deployed
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Select Offers (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose existing offers to include in this campaign
                </p>
                {loadingOffers ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-32" />
                    ))}
                  </div>
                ) : availableOffers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-2">
                    {availableOffers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        id={offer.id}
                        name={offer.name}
                        type={offer.type}
                        vendor={offer.vendor}
                        parameters={offer.parameters}
                        selectable
                        selected={selectedOfferIds.includes(offer.id)}
                        onSelect={toggleOfferSelection}
                      />
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No offers available.{" "}
                      <Link href="/create-offer" className="underline">
                        Create an offer
                      </Link>{" "}
                      first.
                    </AlertDescription>
                  </Alert>
                )}
                {selectedOfferIds.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedOfferIds.length} offer
                    {selectedOfferIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("choice")}
                  disabled={loading}
                >
                  Back to Choice
                </Button>
                <Button
                  onClick={handleCreateManualCampaign}
                  disabled={
                    loading || !campaignName.trim() || !campaignPurpose.trim()
                  }
                  className="gap-2 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State for Initial Auto-Generation */}
        {workflowMode === "ai-assisted" && loading && !suggestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <CardTitle>Generating AI Recommendation...</CardTitle>
              </div>
              <CardDescription>
                Creating a personalized campaign strategy for {season}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        )}

        {/* Step 1: Input */}
        {step === "input" && !loading && (
          <Card>
            <CardHeader>
              <CardTitle>Refine Campaign Details</CardTitle>
              <CardDescription>
                {suggestion
                  ? "Update your inputs to regenerate a new AI strategy suggestion"
                  : "Enter your campaign information to get AI-powered strategy suggestions"}
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
                  disabled={loading}
                  className="gap-2 flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Suggestion...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate Suggestion
                    </>
                  )}
                </Button>
                {suggestion && (
                  <Button
                    variant="outline"
                    onClick={() => setStep("suggestion")}
                  >
                    View Current
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: AI Suggestion */}
        {step === "suggestion" && suggestion && !loading && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle>AI Strategy Suggestion</CardTitle>
                    </div>
                    <CardDescription className="mt-2">
                      Review the AI-generated campaign strategy for {season}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep("input")}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refine
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {suggestion.nameHint && (
                  <div>
                    <Label className="text-muted-foreground">
                      Suggested Name
                    </Label>
                    <p className="text-lg font-semibold mt-1">
                      {suggestion.nameHint}
                    </p>
                  </div>
                )}

                {suggestion.purposeHint && (
                  <div>
                    <Label className="text-muted-foreground">
                      Refined Purpose
                    </Label>
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
                      <div
                        key={idx}
                        className="p-4 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{offer.name}</h4>
                            {offer.vendor && (
                              <Badge variant="outline" className="mt-1">
                                {offer.vendor}
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground mt-2">
                              {offer.reasoning}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {offer.type.replace(/_/g, " ")}
                          </Badge>
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
                        <p className="text-sm text-muted-foreground mt-2">
                          {segment.criteria}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Channels */}
                <div>
                  <Label className="text-lg font-semibold">
                    Recommended Channels
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestion.channels.map((channel) => (
                      <Badge
                        key={channel}
                        variant="secondary"
                        className="text-sm"
                      >
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
                      <Label className="text-lg font-semibold">
                        Suggested Timeline
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Start:</span>
                          <span className="font-medium">
                            {suggestion.timelines.recommendedStart}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">End:</span>
                          <span className="font-medium">
                            {suggestion.timelines.recommendedEnd}
                          </span>
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
                      <Label className="text-lg font-semibold">
                        Strategic Notes
                      </Label>
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

                <Separator />

                {/* Select Existing Offers */}
                <div>
                  <Label className="text-lg font-semibold">
                    Select Existing Offers (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Choose from your existing offers to include in this campaign
                  </p>
                  {loadingOffers ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : availableOffers.length > 0 ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2 max-h-[400px] overflow-y-auto pr-2">
                        {availableOffers.map((offer) => (
                          <OfferCard
                            key={offer.id}
                            id={offer.id}
                            name={offer.name}
                            type={offer.type}
                            vendor={offer.vendor}
                            parameters={offer.parameters}
                            selectable
                            selected={selectedOfferIds.includes(offer.id)}
                            onSelect={toggleOfferSelection}
                          />
                        ))}
                      </div>
                      {selectedOfferIds.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {selectedOfferIds.length} offer
                          {selectedOfferIds.length !== 1 ? "s" : ""} selected
                        </p>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No offers available.{" "}
                        <Link href="/create-offer" className="underline">
                          Create an offer
                        </Link>{" "}
                        first, or the AI will create offers for you.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refine Inputs
              </Button>
              <Button
                onClick={handleCreateCampaign}
                disabled={loading}
                className="gap-2 flex-1"
              >
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
