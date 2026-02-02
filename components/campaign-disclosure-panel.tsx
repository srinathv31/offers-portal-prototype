"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles, FileText, Info } from "lucide-react";
import { format } from "date-fns";
import { MarkdownContent } from "@/components/markdown-renderer";

interface CampaignDisclosure {
  id: string;
  content: string;
  sourceOfferIds: string[];
  generatedAt: string;
}

interface CampaignDisclosurePanelProps {
  campaignId: string;
  existingDisclosure: CampaignDisclosure | null;
  offerCount: number;
  hasOfferDisclosures: boolean;
}

export function CampaignDisclosurePanel({
  campaignId,
  existingDisclosure,
  offerCount,
  hasOfferDisclosures,
}: CampaignDisclosurePanelProps) {
  const [disclosure, setDisclosure] = useState<CampaignDisclosure | null>(
    existingDisclosure
  );
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/generate-disclosure`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setDisclosure({
        id: data.id,
        content: data.content,
        sourceOfferIds: data.sourceOfferIds || [],
        generatedAt: data.generatedAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  // No offer disclosures uploaded yet
  if (!hasOfferDisclosures) {
    return (
      <div className="py-12 text-center">
        <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">
          No offer disclosures available
        </p>
        <p className="text-sm text-muted-foreground">
          Upload disclosure documents to this campaign&apos;s offers first, then
          generate a combined campaign disclosure here.
        </p>
      </div>
    );
  }

  // Has offer disclosures but no campaign disclosure yet
  if (!disclosure) {
    return (
      <div className="py-12 text-center space-y-4">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
        <div>
          <p className="text-muted-foreground mb-1">
            {offerCount} offer{offerCount !== 1 ? "s" : ""} with disclosure
            documents
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a combined campaign disclosure document using AI
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating ? "Generating..." : "Generate Campaign Disclosure"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // Disclosure exists - render it
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Generated{" "}
          {format(new Date(disclosure.generatedAt), "MMM d, yyyy 'at' h:mm a")}{" "}
          &middot; {disclosure.sourceOfferIds.length} offer
          {disclosure.sourceOfferIds.length !== 1 ? "s" : ""} included
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Regenerate
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-lg border bg-muted/30">
        <MarkdownContent content={disclosure.content} />
      </div>
    </div>
  );
}

