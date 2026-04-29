"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { CampaignStatus } from "@/lib/db/schema";

interface WavePlanActionsProps {
  campaignId: string;
  campaignStatus: CampaignStatus;
}

export function WavePlanActions({
  campaignId,
  campaignStatus,
}: WavePlanActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onRegenerate = () => {
    if (campaignStatus === "LIVE" || campaignStatus === "ENDED") {
      const confirmed = window.confirm(
        "Regenerating will rebucket existing enrollments into the new waves. Continue?"
      );
      if (!confirmed) return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/campaigns/${campaignId}/regenerate-waves`,
          { method: "POST", headers: { "content-type": "application/json" } }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to regenerate waves");
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to regenerate waves");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerate}
        disabled={isPending}
        className="gap-2"
      >
        <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {isPending ? "Regenerating..." : "Regenerate"}
      </Button>
    </div>
  );
}
