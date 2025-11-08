import Link from "next/link";
import { getCampaigns } from "@/lib/db/queries/campaigns";
import { CampaignCard } from "@/components/campaign-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function Dashboard() {
  const campaigns = await getCampaigns();

  const liveCampaigns = campaigns.filter((c) => c.status === "LIVE");
  const inReviewCampaigns = campaigns.filter((c) => c.status === "IN_REVIEW");
  const endedCampaigns = campaigns.filter((c) => c.status === "ENDED");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaign Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor your marketing campaigns
          </p>
        </div>
        <Link href="/create-campaign">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </Link>
      </div>

      {liveCampaigns.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Live Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                purpose={campaign.purpose || ""}
                status={campaign.status}
                metrics={campaign.metrics || {}}
              />
            ))}
          </div>
        </section>
      )}

      {inReviewCampaigns.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">In Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inReviewCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                purpose={campaign.purpose || ""}
                status={campaign.status}
                metrics={campaign.metrics || {}}
              />
            ))}
          </div>
        </section>
      )}

      {endedCampaigns.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Ended Campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {endedCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                name={campaign.name}
                purpose={campaign.purpose || ""}
                status={campaign.status}
                metrics={campaign.metrics || {}}
              />
            ))}
          </div>
        </section>
      )}

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No campaigns yet</p>
          <Link href="/create-campaign">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
