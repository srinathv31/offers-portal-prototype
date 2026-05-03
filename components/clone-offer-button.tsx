"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { CloneOfferDialog } from "@/components/clone-offer-dialog";

interface CloneOfferButtonProps {
  offerId: string;
  offerName: string;
}

export function CloneOfferButton({ offerId, offerName }: CloneOfferButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Copy className="h-4 w-4" />
        Clone Offer
      </Button>
      <CloneOfferDialog
        sourceOfferId={offerId}
        sourceOfferName={offerName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
