import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAccountWithDetails } from "@/lib/db";
import { AccountTierBadge } from "@/components/account-tier-badge";
import { AccountStatusBadge } from "@/components/account-status-badge";
import { EnrollmentProgressCard } from "@/components/enrollment-progress-card";
import { TransactionTable } from "@/components/transaction-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  Calendar,
  DollarSign,
  Wallet,
  Target,
  Users,
} from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function AccountDetailContent({ id }: { id: string }) {
  const account = await getAccountWithDetails(id);

  if (!account) {
    notFound();
  }

  const enrollments = account.accountOfferEnrollments || [];
  const transactions = account.accountTransactions || [];
  const spendingGroups = account.spendingGroupAccounts?.map(
    (sga) => sga.spendingGroup
  ) || [];

  // Group enrollments by status
  const enrollmentsByStatus = {
    active: enrollments.filter((e) =>
      ["ENROLLED", "IN_PROGRESS"].includes(e.status)
    ),
    completed: enrollments.filter((e) => e.status === "COMPLETED"),
    other: enrollments.filter((e) =>
      ["EXPIRED", "OPTED_OUT"].includes(e.status)
    ),
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/accounts"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Accounts
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                {account.firstName[0]}
                {account.lastName[0]}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {account.firstName} {account.lastName}
                  </h1>
                  <AccountTierBadge tier={account.tier} />
                  <AccountStatusBadge status={account.status} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {account.accountNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {account.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Member since{" "}
                    {format(new Date(account.memberSince), "MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(account.annualSpend)}
                </p>
                <p className="text-xs text-muted-foreground">Annual Spend</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(account.currentBalance)}
                </p>
                <p className="text-xs text-muted-foreground">Current Balance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-xs text-muted-foreground">
                  Total Enrollments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(account.creditLimit)}
                </p>
                <p className="text-xs text-muted-foreground">Credit Limit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="enrollments" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="groups">Spending Groups</TabsTrigger>
          </TabsList>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments" className="space-y-6">
            {/* Active Enrollments */}
            {enrollmentsByStatus.active.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Active Enrollments ({enrollmentsByStatus.active.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enrollmentsByStatus.active.map((enrollment) => (
                    <EnrollmentProgressCard
                      key={enrollment.id}
                      id={enrollment.id}
                      offerId={enrollment.offerId}
                      offerName={enrollment.offer.name}
                      offerType={enrollment.offer.type}
                      status={enrollment.status}
                      enrolledAt={enrollment.enrolledAt}
                      expiresAt={enrollment.expiresAt}
                      targetAmount={enrollment.targetAmount}
                      currentProgress={enrollment.currentProgress}
                      progressPct={enrollment.progressPct}
                      rewardEarned={enrollment.rewardEarned}
                      completedAt={enrollment.completedAt}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Completed Enrollments */}
            {enrollmentsByStatus.completed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    Completed ({enrollmentsByStatus.completed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enrollmentsByStatus.completed.map((enrollment) => (
                    <EnrollmentProgressCard
                      key={enrollment.id}
                      id={enrollment.id}
                      offerId={enrollment.offerId}
                      offerName={enrollment.offer.name}
                      offerType={enrollment.offer.type}
                      status={enrollment.status}
                      enrolledAt={enrollment.enrolledAt}
                      expiresAt={enrollment.expiresAt}
                      targetAmount={enrollment.targetAmount}
                      currentProgress={enrollment.currentProgress}
                      progressPct={enrollment.progressPct}
                      rewardEarned={enrollment.rewardEarned}
                      completedAt={enrollment.completedAt}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Other Enrollments */}
            {enrollmentsByStatus.other.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground">
                    Expired / Opted Out ({enrollmentsByStatus.other.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {enrollmentsByStatus.other.map((enrollment) => (
                    <EnrollmentProgressCard
                      key={enrollment.id}
                      id={enrollment.id}
                      offerId={enrollment.offerId}
                      offerName={enrollment.offer.name}
                      offerType={enrollment.offer.type}
                      status={enrollment.status}
                      enrolledAt={enrollment.enrolledAt}
                      expiresAt={enrollment.expiresAt}
                      targetAmount={enrollment.targetAmount}
                      currentProgress={enrollment.currentProgress}
                      progressPct={enrollment.progressPct}
                      rewardEarned={enrollment.rewardEarned}
                      completedAt={enrollment.completedAt}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {enrollments.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No offer enrollments for this account
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <TransactionTable
                    transactions={transactions.map((tx) => ({
                      id: tx.id,
                      transactionDate: tx.transactionDate,
                      merchant: tx.merchant,
                      category: tx.category,
                      amount: tx.amount,
                      qualifiesForOffer: tx.qualifiesForOffer,
                    }))}
                    showQualified={true}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No transactions found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spending Groups Tab */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Spending Group Memberships
                </CardTitle>
              </CardHeader>
              <CardContent>
                {spendingGroups.length > 0 ? (
                  <div className="space-y-3">
                    {spendingGroups.map((group) => (
                      <Link
                        key={group.id}
                        href="/spending-groups"
                        className="block p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <h4 className="font-medium">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {group.accountCount.toLocaleString()} accounts
                          </span>
                          <span>
                            {formatCurrency(group.avgSpend)} avg spend
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Not a member of any spending groups
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AccountDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<AccountDetailSkeleton />}>
      <AccountDetailContent id={id} />
    </Suspense>
  );
}

