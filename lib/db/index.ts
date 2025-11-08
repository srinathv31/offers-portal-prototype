import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL environment variable is not set");
// }

// Create postgres connection
const connectionString =
  "postgresql://neondb_owner:npg_0j1KIMyCOVFD@ep-super-grass-ahajj9yl-pooler.c-3.us-east-1.aws.neon.tech/sonnet?sslmode=require&channel_binding=require";
const client = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Helper functions for common queries
export async function getCampaignWithRelations(campaignId: string) {
  const campaign = await db.query.campaigns.findFirst({
    where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
    with: {
      campaignOffers: {
        with: {
          offer: true,
        },
      },
      campaignSegments: {
        with: {
          segment: true,
        },
      },
      campaignEligibilityRules: {
        with: {
          eligibilityRule: true,
        },
      },
      approvals: true,
      channelPlan: true,
      fulfillmentPlan: true,
      controlChecklist: true,
      simulationRuns: {
        orderBy: (runs, { desc }) => [desc(runs.createdAt)],
        limit: 1,
      },
    },
  });

  return campaign;
}

export async function getOfferWithCampaigns(offerId: string) {
  const offer = await db.query.offers.findFirst({
    where: (offers, { eq }) => eq(offers.id, offerId),
    with: {
      campaignOffers: {
        with: {
          campaign: true,
        },
      },
    },
  });

  return offer;
}

export async function getCampaignsByStatus(status: schema.CampaignStatus) {
  const campaigns = await db.query.campaigns.findMany({
    where: (campaigns, { eq }) => eq(campaigns.status, status),
    with: {
      campaignOffers: {
        with: {
          offer: true,
        },
      },
    },
    orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)],
  });

  return campaigns;
}

export async function getAllCampaignsGrouped() {
  const allCampaigns = await db.query.campaigns.findMany({
    with: {
      campaignOffers: {
        with: {
          offer: true,
        },
      },
    },
    orderBy: (campaigns, { desc }) => [desc(campaigns.updatedAt)],
  });

  const grouped = {
    LIVE: allCampaigns.filter((c) => c.status === "LIVE"),
    IN_REVIEW: allCampaigns.filter((c) => c.status === "IN_REVIEW"),
    ENDED: allCampaigns.filter((c) => c.status === "ENDED"),
    DRAFT: allCampaigns.filter((c) => c.status === "DRAFT"),
    TESTING: allCampaigns.filter((c) => c.status === "TESTING"),
  };

  return grouped;
}

export async function getSimulationRun(runId: string) {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
    with: {
      campaign: true,
    },
  });

  return run;
}
