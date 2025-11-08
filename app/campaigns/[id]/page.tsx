import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignById } from "@/lib/db/queries/campaigns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ControlChecklist } from "@/components/control-checklist";
import { ApprovalStatus } from "@/components/approval-status";
import { Play, Rocket } from "lucide-react";
import { PublishButton } from "./publish-button";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  IN_REVIEW: "bg-yellow-500",
  TESTING: "bg-blue-500",
  LIVE: "bg-green-500",
  ENDED: "bg-gray-400",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  TESTING: "Testing",
  LIVE: "Live",
  ENDED: "Ended",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <Badge
              variant="outline"
              className={`text-white border-0 ${statusColors[campaign.status]}`}
            >
              {statusLabels[campaign.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-lg">{campaign.purpose}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/testing/new?campaignId=${id}`}>
            <Button variant="outline">
              <Play className="mr-2 h-4 w-4" />
              Run E2E Test
            </Button>
          </Link>
          {campaign.status === "IN_REVIEW" && <PublishButton campaignId={id} />}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {campaign.metrics?.activations !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Activations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaign.metrics.activations.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
            {campaign.metrics?.revenue !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(campaign.metrics.revenue / 1000).toFixed(0)}k
                  </div>
                </CardContent>
              </Card>
            )}
            {campaign.metrics?.projectedLiftPct !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Projected Lift</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {campaign.metrics.projectedLiftPct.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            )}
            {campaign.metrics?.errorRatePct !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${
                      campaign.metrics.errorRatePct > 1
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {campaign.metrics.errorRatePct.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium">{statusLabels[campaign.status]}</span>
              </div>
              {campaign.startDate && (
                <div>
                  <span className="text-muted-foreground">Start Date:</span>{" "}
                  <span className="font-medium">
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {campaign.endDate && (
                <div>
                  <span className="text-muted-foreground">End Date:</span>{" "}
                  <span className="font-medium">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {campaign.ownerIds && campaign.ownerIds.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Owners:</span>{" "}
                  <span className="font-medium">{campaign.ownerIds.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
              <CardDescription>
                Offers included in this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.offers && campaign.offers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.name}</TableCell>
                        <TableCell>{offer.type}</TableCell>
                        <TableCell>{offer.vendor || "-"}</TableCell>
                        <TableCell>
                          <Link href={`/offers/${offer.id}`}>
                            <Button variant="link" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No offers assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Segments</CardTitle>
              <CardDescription>
                Target segments for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.segments && campaign.segments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.segments.map((segment) => (
                      <TableRow key={segment.id}>
                        <TableCell className="font-medium">{segment.name}</TableCell>
                        <TableCell>{segment.source}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No segments assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Eligibility Rules</CardTitle>
              <CardDescription>
                Rules that determine customer eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.eligibilityRules && campaign.eligibilityRules.length > 0 ? (
                <div className="space-y-4">
                  {campaign.eligibilityRules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="font-medium mb-2">DSL:</div>
                      <code className="text-sm bg-muted p-2 rounded block">
                        {rule.dsl}
                      </code>
                      {rule.dataDependencies && rule.dataDependencies.length > 0 && (
                        <div className="mt-2">
                          <span className="text-muted-foreground text-sm">
                            Data Dependencies:{" "}
                          </span>
                          <span className="text-sm">
                            {rule.dataDependencies.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No eligibility rules defined</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Plan</CardTitle>
              <CardDescription>
                Marketing channels and creatives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.channelPlan ? (
                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Channels: </span>
                    <span>{campaign.channelPlan.channels?.join(", ") || "None"}</span>
                  </div>
                  {campaign.channelPlan.creatives &&
                    campaign.channelPlan.creatives.length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Creatives:</div>
                        <div className="space-y-2">
                          {campaign.channelPlan.creatives.map((creative, idx) => (
                            <div key={idx} className="border rounded p-2">
                              <div className="font-medium text-sm">{creative.channel}</div>
                              <div className="text-sm text-muted-foreground">
                                {creative.preview}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  {campaign.channelPlan.dynamicTnc && (
                    <div>
                      <div className="font-medium mb-2">Dynamic T&Cs:</div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.channelPlan.dynamicTnc}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No channel plan defined</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(campaign.metrics || {}).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-2xl font-bold">
                      {typeof value === "number"
                        ? key.includes("Pct")
                          ? `${value.toFixed(1)}%`
                          : key.includes("revenue")
                            ? `$${(value / 1000).toFixed(0)}k`
                            : value.toLocaleString()
                        : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Control Checklist</CardTitle>
              <CardDescription>
                Pre-publish compliance and risk checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaign.controlChecklist &&
              campaign.controlChecklist.items &&
              campaign.controlChecklist.items.length > 0 ? (
                <ControlChecklist items={campaign.controlChecklist.items} />
              ) : (
                <p className="text-muted-foreground">
                  No control checklist available. Run publish to generate.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approvals</CardTitle>
              <CardDescription>
                Approval status for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovalStatus approvals={campaign.approvals || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

