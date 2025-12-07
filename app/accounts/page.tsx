"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AccountListItem } from "@/components/account-list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Search, X, Filter } from "lucide-react";
import type { AccountTier, AccountStatus } from "@/lib/db/schema";

interface Account {
  id: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: AccountTier;
  status: AccountStatus;
  annualSpend: number;
  accountOfferEnrollments: { id: string }[];
}

function AccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [tier, setTier] = useState<AccountTier | "ALL">(
    (searchParams.get("tier") as AccountTier) || "ALL"
  );
  const [status, setStatus] = useState<AccountStatus | "ALL">(
    (searchParams.get("status") as AccountStatus) || "ALL"
  );

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tier && tier !== "ALL") params.set("tier", tier);
      if (status && status !== "ALL") params.set("status", status);

      const res = await fetch(`/api/accounts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  }, [search, tier, status]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tier && tier !== "ALL") params.set("tier", tier);
    if (status && status !== "ALL") params.set("status", status);

    const query = params.toString();
    router.push(`/accounts${query ? `?${query}` : ""}`, { scroll: false });
  }, [search, tier, status, router]);

  useEffect(() => {
    const timeout = setTimeout(updateURL, 300);
    return () => clearTimeout(timeout);
  }, [updateURL]);

  const clearFilters = () => {
    setSearch("");
    setTier("ALL");
    setStatus("ALL");
  };

  const hasFilters = search || tier !== "ALL" || status !== "ALL";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Accounts</h1>
          </div>
          <p className="text-muted-foreground">
            Browse and manage customer accounts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or account number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={tier}
                onValueChange={(v) => setTier(v as AccountTier | "ALL")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tiers</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="PLATINUM">Platinum</SelectItem>
                  <SelectItem value="DIAMOND">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AccountStatus | "ALL")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : accounts.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""} found
            </p>
            <div className="space-y-3">
              {accounts.map((account) => (
                <AccountListItem
                  key={account.id}
                  id={account.id}
                  accountNumber={account.accountNumber}
                  firstName={account.firstName}
                  lastName={account.lastName}
                  email={account.email}
                  tier={account.tier}
                  status={account.status}
                  annualSpend={account.annualSpend}
                  enrollmentCount={account.accountOfferEnrollments?.length || 0}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No accounts found</h2>
            <p className="text-muted-foreground mb-4">
              {hasFilters
                ? "Try adjusting your filters"
                : "No accounts have been created yet"}
            </p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AccountsSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}

