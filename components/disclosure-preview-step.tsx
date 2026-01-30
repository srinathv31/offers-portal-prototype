"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
  FileText,
  AlertCircle,
} from "lucide-react";
import { OfferDisclosureStatusCard } from "@/components/offer-disclosure-status-card";
import { MarkdownContent } from "@/components/markdown-renderer";
import type { OfferType } from "@/lib/db/schema";

interface OfferWithDisclosures {
  id: string;
  name: string;
  type: OfferType;
  vendor: string | null;
  disclosures?: Array<{ id: string }>;
}

interface DisclosurePreviewStepProps {
  offerIds: string[];
  campaignName: string;
  onDisclosureGenerated: (content: string, sourceOfferIds: string[]) => void;
  onBack: () => void;
  onCreateCampaign: () => void;
  loading: boolean;
}

type GenerationStage =
  | "idle"
  | "extracting"
  | "analyzing"
  | "generating"
  | "done";

const stageMessages: Record<GenerationStage, string> = {
  idle: "",
  extracting: "Extracting document content...",
  analyzing: "Analyzing disclosure requirements...",
  generating: "Generating combined disclosure...",
  done: "Disclosure generated successfully!",
};

export function DisclosurePreviewStep({
  offerIds,
  campaignName,
  onDisclosureGenerated,
  onBack,
  onCreateCampaign,
  loading,
}: DisclosurePreviewStepProps) {
  const [generationStage, setGenerationStage] = useState<GenerationStage>("idle");
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceOfferIds, setSourceOfferIds] = useState<string[]>([]);

  // Internal state for fetched offers with disclosures
  const [selectedOffers, setSelectedOffers] = useState<OfferWithDisclosures[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // Fetch offers with disclosures when component mounts or offerIds change
  useEffect(() => {
    const fetchOffers = async () => {
      if (offerIds.length === 0) {
        setSelectedOffers([]);
        setLoadingOffers(false);
        return;
      }
      setLoadingOffers(true);
      try {
        const res = await fetch(`/api/offers/by-ids?ids=${offerIds.join(",")}`);
        if (!res.ok) {
          throw new Error("Failed to fetch offers");
        }
        const data: OfferWithDisclosures[] = await res.json();
        setSelectedOffers(data);
      } catch (err) {
        console.error("Failed to fetch offers with disclosures:", err);
        setSelectedOffers([]);
      } finally {
        setLoadingOffers(false);
      }
    };
    fetchOffers();
  }, [offerIds]);

  // Calculate disclosure statistics
  const offersWithDisclosures = selectedOffers.filter(
    (o) => o.disclosures && o.disclosures.length > 0
  );
  const offersWithoutDisclosures = selectedOffers.filter(
    (o) => !o.disclosures || o.disclosures.length === 0
  );
  const totalDisclosures = offersWithDisclosures.reduce(
    (sum, o) => sum + (o.disclosures?.length || 0),
    0
  );
  const hasAnyDisclosures = offersWithDisclosures.length > 0;

  const handleGenerateDisclosure = async () => {
    setError(null);
    setGenerationStage("extracting");

    try {
      // Simulate stage progression for demo effect
      await new Promise((r) => setTimeout(r, 800));
      setGenerationStage("analyzing");
      await new Promise((r) => setTimeout(r, 600));
      setGenerationStage("generating");

      const response = await fetch("/api/disclosures/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          offerIds: selectedOffers.map((o) => o.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate disclosure preview");
      }

      const data = await response.json();

      if (!data.content) {
        throw new Error(
          data.message || "No disclosure content could be generated"
        );
      }

      setGeneratedContent(data.content);
      setSourceOfferIds(data.offersIncluded.map((o: { offerId: string }) => o.offerId));
      setGenerationStage("done");

      // Notify parent component
      onDisclosureGenerated(
        data.content,
        data.offersIncluded.map((o: { offerId: string }) => o.offerId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setGenerationStage("idle");
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    setGenerationStage("idle");
    setSourceOfferIds([]);
    handleGenerateDisclosure();
  };

  const isGenerating =
    generationStage !== "idle" && generationStage !== "done";

  return (
    <div className="space-y-6">
      {/* Offer Disclosure Status Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Offer Disclosure Status</CardTitle>
          </div>
          <CardDescription>
            Review which offers have disclosures attached before generating the
            campaign disclosure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Cards */}
          <div className="space-y-2">
            {loadingOffers ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              selectedOffers.map((offer) => (
                <OfferDisclosureStatusCard
                  key={offer.id}
                  offerName={offer.name}
                  offerType={offer.type}
                  vendor={offer.vendor}
                  disclosureCount={offer.disclosures?.length || 0}
                />
              ))
            )}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {loadingOffers ? (
                <Skeleton className="h-4 w-48 inline-block" />
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {offersWithDisclosures.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {selectedOffers.length}
                  </span>{" "}
                  offers have disclosures ({totalDisclosures} total documents)
                </>
              )}
            </div>
          </div>

          {/* Warning if some offers don't have disclosures */}
          {!loadingOffers && offersWithoutDisclosures.length > 0 && hasAnyDisclosures && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {offersWithoutDisclosures.length} offer
                {offersWithoutDisclosures.length !== 1 ? "s" : ""} without
                disclosures will be skipped in the combined disclosure document.
              </AlertDescription>
            </Alert>
          )}

          {/* No disclosures warning */}
          {!loadingOffers && !hasAnyDisclosures && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                None of the selected offers have disclosures attached. You can
                still create the campaign, but no disclosure document will be
                generated.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Generate Button */}
          <div className="flex flex-col items-center gap-3 py-2">
            {generatedContent ? (
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
                />
                Regenerate Disclosure
              </Button>
            ) : (
              <Button
                onClick={handleGenerateDisclosure}
                disabled={loadingOffers || !hasAnyDisclosures || isGenerating}
                className="gap-2 min-w-[280px]"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {stageMessages[generationStage]}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Campaign Disclosure
                  </>
                )}
              </Button>
            )}
            {isGenerating && (
              <p className="text-xs text-muted-foreground animate-pulse">
                This may take a moment...
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Disclosure Preview */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>Generated Disclosure Preview</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">
                {sourceOfferIds.length} offer
                {sourceOfferIds.length !== 1 ? "s" : ""} included
              </span>
            </div>
            <CardDescription>
              Review the AI-generated combined disclosure document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
              <MarkdownContent content={generatedContent} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading || isGenerating}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Suggestion
        </Button>
        <Button
          onClick={onCreateCampaign}
          disabled={loading || isGenerating}
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
              {generatedContent
                ? "Accept & Create Campaign"
                : "Skip Disclosure & Create Campaign"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
