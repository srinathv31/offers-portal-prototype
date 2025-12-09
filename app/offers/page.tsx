"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { OfferCard } from "@/components/offer-card";
import { Plus, Search } from "lucide-react";
import type { OfferType } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

interface Offer {
  id: string;
  name: string;
  type: OfferType;
  vendor: string | null;
  parameters: Record<string, any>;
  campaignOffers: Array<{ campaign: any }>;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (typeFilter !== "all") params.set("type", typeFilter);
        if (vendorFilter !== "all") params.set("vendor", vendorFilter);

        const res = await fetch(`/api/offers?${params.toString()}`);
        const data = await res.json();
        setOffers(data);
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchOffers, 300);
    return () => clearTimeout(debounce);
  }, [search, typeFilter, vendorFilter]);

  // Get unique vendors from offers
  const uniqueVendors = Array.from(
    new Set(offers.map((o) => o.vendor).filter(Boolean))
  ).sort() as string[];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Offers</h1>
              <p className="text-muted-foreground mt-2">
                Manage and create reusable offers for campaigns
              </p>
            </div>
            <Link href="/create-offer">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Offer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="POINTS_MULTIPLIER">Points Multiplier</SelectItem>
                <SelectItem value="CASHBACK">Cashback</SelectItem>
                <SelectItem value="DISCOUNT">Discount</SelectItem>
                <SelectItem value="BONUS">Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {uniqueVendors.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                id={offer.id}
                name={offer.name}
                type={offer.type}
                vendor={offer.vendor}
                parameters={offer.parameters}
                campaignCount={offer.campaignOffers.length}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No offers found</h3>
            <p className="text-muted-foreground mb-4">
              {search || typeFilter !== "all" || vendorFilter !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first offer"}
            </p>
            {!search && typeFilter === "all" && vendorFilter === "all" && (
              <Link href="/create-offer">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Offer
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Summary */}
        {!loading && offers.length > 0 && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            Showing {offers.length} offer{offers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

