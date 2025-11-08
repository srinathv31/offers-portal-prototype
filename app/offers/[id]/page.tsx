import { notFound } from "next/navigation";
import Link from "next/link";
import { getOfferById } from "@/lib/db/queries/offers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offer = await getOfferById(id);

  if (!offer) {
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
          <h1 className="text-3xl font-bold mb-2">{offer.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{offer.type}</Badge>
            {offer.vendor && (
              <Badge variant="secondary">{offer.vendor}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Offer Details</CardTitle>
            <CardDescription>Parameters and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-muted-foreground">Type:</span>{" "}
              <span className="font-medium">{offer.type}</span>
            </div>
            {offer.vendor && (
              <div>
                <span className="text-muted-foreground">Vendor:</span>{" "}
                <span className="font-medium">{offer.vendor}</span>
              </div>
            )}
            {offer.effectiveFrom && (
              <div>
                <span className="text-muted-foreground">Effective From:</span>{" "}
                <span className="font-medium">
                  {new Date(offer.effectiveFrom).toLocaleDateString()}
                </span>
              </div>
            )}
            {offer.effectiveTo && (
              <div>
                <span className="text-muted-foreground">Effective To:</span>{" "}
                <span className="font-medium">
                  {new Date(offer.effectiveTo).toLocaleDateString()}
                </span>
              </div>
            )}
            {offer.parameters && Object.keys(offer.parameters).length > 0 && (
              <div>
                <div className="font-medium mb-2">Parameters:</div>
                <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(offer.parameters, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Used In Campaigns</CardTitle>
            <CardDescription>
              Campaigns that use this offer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offer.usedInCampaigns && offer.usedInCampaigns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offer.usedInCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{campaign.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Button variant="link" size="sm">
                            View Campaign
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">
                This offer is not used in any campaigns yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {offer.lastCampaign && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Last Campaign Performance</CardTitle>
            <CardDescription>
              Performance metrics from the most recent campaign using this offer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {offer.lastCampaign.metrics?.revenue !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                  <div className="text-xl font-bold">
                    ${(offer.lastCampaign.metrics.revenue / 1000).toFixed(0)}k
                  </div>
                </div>
              )}
              {offer.lastCampaign.metrics?.errorRatePct !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                  <div className="text-xl font-bold">
                    {offer.lastCampaign.metrics.errorRatePct.toFixed(1)}%
                  </div>
                </div>
              )}
              {offer.lastCampaign.metrics?.activations !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Activations</div>
                  <div className="text-xl font-bold">
                    {offer.lastCampaign.metrics.activations.toLocaleString()}
                  </div>
                </div>
              )}
              {offer.lastCampaign.metrics?.projectedLiftPct !== undefined && (
                <div>
                  <div className="text-sm text-muted-foreground">Projected Lift</div>
                  <div className="text-xl font-bold text-green-600">
                    {offer.lastCampaign.metrics.projectedLiftPct.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link href={`/campaigns/${offer.lastCampaign.id}`}>
                <Button variant="outline">
                  View Campaign Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

