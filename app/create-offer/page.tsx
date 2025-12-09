"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OfferForm } from "@/components/offer-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, XCircle } from "lucide-react";

export default function CreateOfferPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/offers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create offer");
      }

      const result = await response.json();
      router.push(`/offers/${result.offerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Offers
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Create New Offer</h1>
          <p className="text-muted-foreground mt-2">
            Define a reusable offer that can be used across multiple campaigns
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <OfferForm
          onSubmit={handleSubmit}
          submitLabel="Create Offer"
          loading={loading}
        />
      </div>
    </div>
  );
}

