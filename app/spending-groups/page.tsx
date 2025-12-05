import { Suspense } from "react";
import { getAllSpendingGroups } from "@/lib/db";
import { SpendingGroupCard } from "@/components/spending-group-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";

async function SpendingGroupsContent() {
  const groups = await getAllSpendingGroups();

  // Calculate totals
  const totalAccounts = groups.reduce((sum, g) => sum + g.accountCount, 0);
  const avgSpendAcrossGroups =
    groups.length > 0
      ? groups.reduce((sum, g) => sum + g.avgSpend, 0) / groups.length
      : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Spending Groups
            </h1>
          </div>
          <p className="text-muted-foreground">
            Account groupings based on spending behavior and patterns
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold">{groups.length}</span> spending
                groups
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold">
                  {totalAccounts.toLocaleString()}
                </span>{" "}
                total accounts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(avgSpendAcrossGroups / 100)}
                </span>{" "}
                avg spend
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {groups.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((group) => (
              <SpendingGroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                description={group.description}
                accountCount={group.accountCount}
                avgSpend={group.avgSpend}
                accounts={group.spendingGroupAccounts.map((sga) => ({
                  id: sga.account.id,
                  firstName: sga.account.firstName,
                  lastName: sga.account.lastName,
                  accountNumber: sga.account.accountNumber,
                  tier: sga.account.tier,
                  annualSpend: sga.account.annualSpend,
                }))}
                segments={group.segmentSpendingGroups.map((ssg) => ({
                  id: ssg.segment.id,
                  name: ssg.segment.name,
                }))}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No spending groups</h2>
            <p className="text-muted-foreground">
              No spending groups have been created yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SpendingGroupsSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SpendingGroupsPage() {
  return (
    <Suspense fallback={<SpendingGroupsSkeleton />}>
      <SpendingGroupsContent />
    </Suspense>
  );
}

