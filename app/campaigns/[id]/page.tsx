import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignWithRelations, getEnrollmentsByCampaign } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { MetricKPI } from "@/components/metric-kpi";
import { OfferListItem } from "@/components/offer-list-item";
import { ControlChecklistView } from "@/components/control-checklist-view";
import { ApprovalList } from "@/components/approval-list";
import { EnrollmentStatusBadge } from "@/components/enrollment-status-badge";
import { AccountTierBadge } from "@/components/account-tier-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, PlayCircle, Rocket, Calendar, User, Users, Target } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function CampaignDetailContent({ id }: { id: string }) {
  const [campaign, enrollments] = await Promise.all([
    getCampaignWithRelations(id),
    getEnrollmentsByCampaign(id),
  ]);

  if (!campaign) {
    notFound();
  }

  const offers = campaign.campaignOffers.map((co) => co.offer);
  const segments = campaign.campaignSegments.map((cs) => cs.segment);
  const rules = campaign.campaignEligibilityRules.map((cr) => cr.eligibilityRule);
  const metrics = campaign.metrics as {
    activations?: number;
    revenue?: number;
    projected_lift_pct?: number;
    error_rate_pct?: number;
  };

  // Group enrollments by status
  const enrollmentStats = {
    total: enrollments.length,
    enrolled: enrollments.filter((e) => e.status === "ENROLLED").length,
    inProgress: enrollments.filter((e) => e.status === "IN_PROGRESS").length,
    completed: enrollments.filter((e) => e.status === "COMPLETED").length,
    expired: enrollments.filter((e) => e.status === "EXPIRED").length,
    optedOut: enrollments.filter((e) => e.status === "OPTED_OUT").length,
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">{campaign.name}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="text-muted-foreground text-lg">{campaign.purpose}</p>
              {campaign.startDate && campaign.endDate && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(campaign.startDate), "MMM d, yyyy")} →{" "}
                    {format(new Date(campaign.endDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <form action={`/api/simulate?campaignId=${campaign.id}`} method="POST">
                <Button variant="outline" className="gap-2" type="submit">
                  <PlayCircle className="h-4 w-4" />
                  Run E2E Test
                </Button>
              </form>
              {campaign.status === "IN_REVIEW" && (
                <form action={`/api/campaigns/${campaign.id}/publish`} method="POST">
                  <Button className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Publish
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricKPI
              label="Activations"
              value={metrics?.activations || 0}
              tooltip="Number of customers who activated this campaign"
            />
            <MetricKPI
              label="Revenue"
              value={metrics?.revenue || 0}
              tooltip="Total revenue generated from this campaign"
            />
            <MetricKPI
              label="Projected Lift"
              value={`${(metrics?.projected_lift_pct || 0).toFixed(1)}%`}
              tooltip="Projected or actual lift in customer engagement"
              trend={
                (metrics?.projected_lift_pct || 0) > 15
                  ? "up"
                  : (metrics?.projected_lift_pct || 0) < 10
                  ? "down"
                  : "neutral"
              }
            />
            <MetricKPI
              label="Error Rate"
              value={`${(metrics?.error_rate_pct || 0).toFixed(2)}%`}
              tooltip="Percentage of errors during campaign execution"
              trend={
                (metrics?.error_rate_pct || 0) < 1
                  ? "up"
                  : (metrics?.error_rate_pct || 0) > 2
                  ? "down"
                  : "neutral"
              }
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="enrollments">
              Enrollments
              {enrollmentStats.total > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {enrollmentStats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="targeting">Targeting</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                  <p className="mt-1">{campaign.purpose}</p>
                </div>
                {campaign.ownerIds && (campaign.ownerIds as string[]).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Owners</label>
                    <div className="flex items-center gap-2 mt-2">
                      {(campaign.ownerIds as string[]).map((owner) => (
                        <Badge key={owner} variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          {owner}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Offers</label>
                    <p className="mt-1 text-2xl font-bold">{offers.length}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Segments</label>
                    <p className="mt-1 text-2xl font-bold">{segments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {campaign.channelPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Channel Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Channels</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {((campaign.channelPlan.channels as string[]) || []).map((channel) => (
                        <Badge key={channel} variant="outline">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {campaign.channelPlan.dynamicTnc && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Terms & Conditions</label>
                      <p className="mt-1 text-sm">{campaign.channelPlan.dynamicTnc}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Offers ({offers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {offers.length > 0 ? (
                  offers.map((offer) => (
                    <OfferListItem
                      key={offer.id}
                      id={offer.id}
                      name={offer.name}
                      type={offer.type}
                      vendor={offer.vendor}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No offers added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enrollments Tab */}
          <TabsContent value="enrollments" className="space-y-6">
            {/* Enrollment Stats */}
            {enrollmentStats.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Enrollment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-2xl font-bold">{enrollmentStats.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {enrollmentStats.enrolled}
                      </p>
                      <p className="text-xs text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {enrollmentStats.inProgress}
                      </p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {enrollmentStats.completed}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-900/20">
                      <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                        {enrollmentStats.expired + enrollmentStats.optedOut}
                      </p>
                      <p className="text-xs text-muted-foreground">Expired/Opted Out</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enrollment List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Enrolled Accounts ({enrollments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length > 0 ? (
                  <div className="space-y-3">
                    {enrollments.map((enrollment) => (
                      <Link
                        key={enrollment.id}
                        href={`/accounts/${enrollment.account.id}`}
                        className="block p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                              {enrollment.account.firstName[0]}
                              {enrollment.account.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {enrollment.account.firstName} {enrollment.account.lastName}
                                </span>
                                <AccountTierBadge tier={enrollment.account.tier} showIcon={false} />
                                <EnrollmentStatusBadge status={enrollment.status} showIcon={false} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {enrollment.offer.name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {enrollment.targetAmount != null && enrollment.targetAmount > 0 && (
                              <div className="w-32">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">
                                    {parseFloat(String(enrollment.progressPct)).toFixed(0)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={Math.min(parseFloat(String(enrollment.progressPct)), 100)} 
                                  className="h-1.5" 
                                />
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Enrolled {format(new Date(enrollment.enrolledAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No accounts enrolled in this campaign yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targeting Tab */}
          <TabsContent value="targeting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Segments ({segments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {segments.length > 0 ? (
                  segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{segment.name}</h4>
                        <Badge variant="outline">{segment.source}</Badge>
                      </div>
                      {segment.definitionJson && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Est. Size:{" "}
                          {((segment.definitionJson as { estimatedSize?: number })?.estimatedSize || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No segments defined yet</p>
                )}
              </CardContent>
            </Card>

            {rules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Eligibility Rules ({rules.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="p-4 rounded-lg border bg-muted/50">
                      <code className="text-sm">{rule.dsl}</code>
                      {rule.dataDependencies && (rule.dataDependencies as string[]).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(rule.dataDependencies as string[]).map((dep) => (
                            <Badge key={dep} variant="secondary" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Controls & Approvals Tab */}
          <TabsContent value="controls" className="space-y-6">
            {campaign.controlChecklist && (
              <Card>
                <CardHeader>
                  <CardTitle>Control Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ControlChecklistView
                    items={(campaign.controlChecklist.items as Array<{ id: string; label: string; checked: boolean }>) || []}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalList approvals={campaign.approvals || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CampaignDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-12 w-96 mb-2" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<CampaignDetailSkeleton />}>
      <CampaignDetailContent id={id} />
    </Suspense>
  );
}

