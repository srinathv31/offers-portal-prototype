"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2 } from "lucide-react";

interface CloneOfferDialogProps {
  sourceOfferId: string;
  sourceOfferName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneOfferDialog({
  sourceOfferId,
  sourceOfferName,
  open,
  onOpenChange,
}: CloneOfferDialogProps) {
  const router = useRouter();
  const defaultName = `${sourceOfferName} (Copy)`;
  const [name, setName] = useState(defaultName);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(`${sourceOfferName} (Copy)`);
      setEffectiveFrom("");
      setEffectiveTo("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, sourceOfferName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/offers/${sourceOfferId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          effectiveFrom: effectiveFrom || undefined,
          effectiveTo: effectiveTo || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clone offer");
      }

      const data = await res.json();
      onOpenChange(false);
      router.push(`/offers/${data.offerId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clone offer");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clone Offer
          </DialogTitle>
          <DialogDescription>
            Create a copy of <span className="font-medium">{sourceOfferName}</span> with a new effective date range. All parameters and disclosures will be carried over.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clone-name">Offer Name *</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="clone-effective-from">Effective From</Label>
              <Input
                id="clone-effective-from"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clone-effective-to">Effective To</Label>
              <Input
                id="clone-effective-to"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim()}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Clone Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
