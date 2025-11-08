"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { createCampaignAction } from "@/app/actions/create-campaign";
import type { StrategySuggestion } from "@/lib/ai/strategy";

type FormData = {
  name: string;
  purpose: string;
  season: string;
  objective: string;
};

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<"basic" | "ai-suggest" | "review">("basic");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<StrategySuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [useSuggestion, setUseSuggestion] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const season = watch("season");
  const objective = watch("objective");

  const handleAISuggest = async () => {
    if (!season || !objective) {
      alert("Please fill in season and objective first");
      return;
    }

    setSuggestionLoading(true);
    try {
      const response = await fetch("/api/ai/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ season, objective }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate suggestion");
      }

      const data = await response.json();
      setSuggestion(data);
      setStep("ai-suggest");
    } catch (error) {
      console.error("Error generating AI suggestion:", error);
      alert("Failed to generate AI suggestion");
    } finally {
      setSuggestionLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await createCampaignAction({
        name: data.name,
        purpose: data.purpose,
        // In a real app, we'd use the suggestion data to create offers/segments
        // For now, just create the campaign with basic info
      });
      // Redirect happens in the action
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Create New Campaign</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === "basic" && (
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Enter basic information about your campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Campaign name is required" })}
                  placeholder="e.g., Holiday Shopping Extravaganza"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  {...register("purpose", { required: "Purpose is required" })}
                  placeholder="Describe the goal of this campaign..."
                  rows={4}
                />
                {errors.purpose && (
                  <p className="text-sm text-destructive mt-1">{errors.purpose.message}</p>
                )}
              </div>

              <Separator />

              <div>
                <Label htmlFor="season">Season</Label>
                <Input
                  id="season"
                  {...register("season")}
                  placeholder="e.g., Holiday, Summer, Q4"
                />
              </div>

              <div>
                <Label htmlFor="objective">Objective</Label>
                <Textarea
                  id="objective"
                  {...register("objective")}
                  placeholder="Describe your marketing objective..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAISuggest}
                  disabled={suggestionLoading || !season || !objective}
                >
                  {suggestionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Suggest Strategy
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("review")}
                >
                  Skip AI & Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "ai-suggest" && suggestion && (
          <Card>
            <CardHeader>
              <CardTitle>AI Strategy Suggestion</CardTitle>
              <CardDescription>
                Review the AI-generated strategy suggestion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  The AI has generated a strategy based on your inputs. You can accept
                  it or continue with manual setup.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {suggestion.nameHint && (
                  <div>
                    <Label>Suggested Name</Label>
                    <p className="text-sm font-medium">{suggestion.nameHint}</p>
                  </div>
                )}

                {suggestion.purposeHint && (
                  <div>
                    <Label>Suggested Purpose</Label>
                    <p className="text-sm">{suggestion.purposeHint}</p>
                  </div>
                )}

                {suggestion.recommendedOffers && suggestion.recommendedOffers.length > 0 && (
                  <div>
                    <Label>Recommended Offers</Label>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {suggestion.recommendedOffers.map((offer, idx) => (
                        <li key={idx} className="text-sm">
                          {offer.name} ({offer.type})
                          {offer.vendor && ` - ${offer.vendor}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestion.segments && suggestion.segments.length > 0 && (
                  <div>
                    <Label>Recommended Segments</Label>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {suggestion.segments.map((segment, idx) => (
                        <li key={idx} className="text-sm">
                          {segment.name} ({segment.source})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestion.channels && suggestion.channels.length > 0 && (
                  <div>
                    <Label>Recommended Channels</Label>
                    <p className="text-sm">{suggestion.channels.join(", ")}</p>
                  </div>
                )}

                {suggestion.notes && suggestion.notes.length > 0 && (
                  <div>
                    <Label>Notes</Label>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      {suggestion.notes.map((note, idx) => (
                        <li key={idx} className="text-sm">{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setUseSuggestion(true);
                    setStep("review");
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept Suggestion
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUseSuggestion(false);
                    setStep("review");
                  }}
                >
                  Start from Scratch
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("basic")}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Create</CardTitle>
              <CardDescription>
                Review your campaign details and create it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <p className="text-sm font-medium">{watch("name")}</p>
              </div>
              <div>
                <Label>Purpose</Label>
                <p className="text-sm">{watch("purpose")}</p>
              </div>

              {useSuggestion && suggestion && (
                <Alert>
                  <AlertDescription>
                    Campaign will be created using AI suggestion data.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Campaign"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("basic")}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}

