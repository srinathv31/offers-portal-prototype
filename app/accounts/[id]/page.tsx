import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAccountWithDetails } from "@/lib/db";
import { AccountTierBadge } from "@/components/account-tier-badge";
import { AccountStatusBadge } from "@/components/account-status-badge";
import { EnrollmentProgressCard } from "@/components/enrollment-progress-card";
import { AccountTransactionsTab } from "@/components/account-transactions-tab";
import { CreditCardProductBadge } from "@/components/credit-card-product-badge";
import { creditCardProductDescriptions } from "@/lib/credit-card-utils";
import { Badge } from "@/components/ui/badge";
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
  Star,
  Clock,
  Activity,
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
  const spendingGroups =
    account.spendingGroupAccounts?.map((sga) => sga.spendingGroup) || [];
  const creditCards = account.accountCreditCards || [];

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
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="credit-cards">Credit Cards</TabsTrigger>
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
            <AccountTransactionsTab
              accountId={account.id}
              initialTransactions={transactions.map((tx) => ({
                id: tx.id,
                transactionDate: tx.transactionDate.toISOString(),
                merchant: tx.merchant,
                category: tx.category,
                amount: tx.amount,
                qualifiesForOffer: tx.qualifiesForOffer,
                metadata: tx.metadata,
                enrollment: tx.enrollment
                  ? {
                      offerName: tx.enrollment.offer.name,
                      offerType: tx.enrollment.offer.type,
                      campaignName: tx.enrollment.campaign?.name ?? null,
                    }
                  : null,
                creditCard: tx.creditCard
                  ? {
                      id: tx.creditCard.id,
                      creditCardProduct: tx.creditCard.creditCardProduct,
                      lastFourDigits: tx.creditCard.lastFourDigits,
                    }
                  : null,
              }))}
            />
          </TabsContent>

          {/* Credit Cards Tab */}
          <TabsContent value="credit-cards">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credit Cards ({creditCards.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {creditCards.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {creditCards.map((acc) => {
                      const card = acc.creditCard;
                      return (
                        <div
                          key={card.id}
                          className="relative p-5 rounded-xl border bg-gradient-to-br from-card to-muted/30 space-y-4"
                        >
                          {/* Primary Badge */}
                          {acc.isPrimary && (
                            <Badge
                              variant="secondary"
                              className="absolute top-3 right-3 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            >
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              Primary
                            </Badge>
                          )}

                          {/* Card Product & Number */}
                          <div className="space-y-1">
                            <CreditCardProductBadge
                              product={card.creditCardProduct}
                            />
                            <p className="text-xs text-muted-foreground">
                              {
                                creditCardProductDescriptions[
                                  card.creditCardProduct
                                ]
                              }
                            </p>
                          </div>

                          {/* Card Number */}
                          <p className="font-mono text-lg tracking-wider">
                            {card.cardNumber}
                          </p>

                          {/* Financial Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Credit Limit
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(card.creditLimit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Current Balance
                              </p>
                              <p className="font-semibold">
                                {formatCurrency(card.currentBalance)}
                              </p>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Opened{" "}
                                {format(new Date(card.openedAt), "MMM yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                Expires{" "}
                                {format(new Date(card.expirationDate), "MM/yy")}
                              </span>
                            </div>
                          </div>

                          {/* Usage Stats */}
                          <div className="pt-3 border-t space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Activity className="h-4 w-4" />
                                Usage Count
                              </span>
                              <span className="font-medium">
                                {acc.usageCount} transactions
                              </span>
                            </div>
                            {acc.lastUsedAt && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Last Used
                                </span>
                                <span>
                                  {format(
                                    new Date(acc.lastUsedAt),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              </div>
                            )}
                            {acc.preferredForCategory && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Preferred For
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {acc.preferredForCategory}
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                card.isActive ? "bg-green-500" : "bg-red-500"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {card.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No credit cards associated with this account
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
