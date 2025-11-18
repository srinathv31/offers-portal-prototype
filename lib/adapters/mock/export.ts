import { db } from "@/lib/db";
import { format } from "date-fns";

interface ReportData {
  runId: string;
  campaignName: string;
  campaignId: string;
  generatedAt: string;
  executionSummary: {
    startedAt: string;
    finishedAt: string;
    duration: string;
    success: boolean;
  };
  inputs: Record<string, any>;
  projections: {
    revenue: number;
    activations: number;
    error_rate_pct: number;
  };
  steps: Array<{
    key: string;
    label: string;
    status: string;
  }>;
  errors: Array<{ message: string; step?: string }>;
  offers: Array<{
    id: string;
    name: string;
    type: string;
    vendor?: string;
  }>;
  segments: Array<{
    id: string;
    name: string;
    source: string;
    estimatedSize: number;
  }>;
  channelPlan?: {
    channels: string[];
    creatives: Array<{ channel: string; preview: string }>;
  };
  recommendations: string[];
}

/**
 * Build a comprehensive report for a simulation run
 * Returns JSON report data
 */
export async function buildReport(runId: string): Promise<ReportData> {
  console.log(`[Export] Building report for run: ${runId}`);

  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
    with: {
      campaign: {
        with: {
          campaignOffers: {
            with: { offer: true },
          },
          campaignSegments: {
            with: { segment: true },
          },
          channelPlan: true,
        },
      },
    },
  });

  if (!run || !run.campaign) {
    throw new Error(`Simulation run ${runId} not found`);
  }

  const campaign = run.campaign;

  // Calculate execution duration
  const durationMs = run.finishedAt
    ? run.finishedAt.getTime() - run.startedAt.getTime()
    : Date.now() - run.startedAt.getTime();
  const durationSeconds = Math.floor(durationMs / 1000);

  // Build report data
  const reportData: ReportData = {
    runId: run.id,
    campaignName: campaign.name,
    campaignId: campaign.id,
    generatedAt: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    executionSummary: {
      startedAt: format(run.startedAt, "yyyy-MM-dd HH:mm:ss"),
      finishedAt: run.finishedAt ? format(run.finishedAt, "yyyy-MM-dd HH:mm:ss") : "In Progress",
      duration: `${durationSeconds}s`,
      success: run.success || false,
    },
    inputs: run.inputs as Record<string, any>,
    projections: run.projections as any,
    steps: run.steps as any,
    errors: run.errors as any,
    offers: campaign.campaignOffers.map((co) => ({
      id: co.offer.id,
      name: co.offer.name,
      type: co.offer.type,
      vendor: co.offer.vendor || undefined,
    })),
    segments: campaign.campaignSegments.map((cs) => {
      const definitionJson = cs.segment.definitionJson as any;
      return {
        id: cs.segment.id,
        name: cs.segment.name,
        source: cs.segment.source,
        estimatedSize: definitionJson?.estimatedSize || 0,
      };
    }),
    channelPlan: campaign.channelPlan
      ? {
          channels: (campaign.channelPlan.channels as string[]) || [],
          creatives: (campaign.channelPlan.creatives as any[]) || [],
        }
      : undefined,
    recommendations: generateRecommendations(run),
  };

  console.log(`[Export] Report built successfully for run: ${runId}`);

  return reportData;
}

/**
 * Simulate email delivery of report
 * Returns delivery confirmation
 */
export async function emailReport(
  to: string,
  runId: string
): Promise<{ delivered: boolean; messageId: string }> {
  console.log(`[Export] Emailing report for run ${runId} to ${to}`);

  // In production, this would call an email service like SendGrid or SES
  // For POC, we just simulate success

  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  console.log(`[Export] Email delivered with message ID: ${messageId}`);

  return {
    delivered: true,
    messageId,
  };
}

/**
 * Generate recommendations based on simulation results
 */
function generateRecommendations(run: any): string[] {
  const recommendations: string[] = [];

  const projections = run.projections as any;
  const errors = run.errors as any[];

  // Check error rate
  if (projections.error_rate_pct > 2) {
    recommendations.push(
      "⚠️ Error rate is above 2%. Review eligibility rules and data dependencies."
    );
  } else if (projections.error_rate_pct < 1) {
    recommendations.push("✓ Error rate is low. Campaign is ready for production.");
  }

  // Check activation rate
  const activationRate =
    projections.activations / ((run.inputs as any)?.cohortSize || 1);
  if (activationRate < 0.2) {
    recommendations.push(
      "⚠️ Activation rate is below 20%. Consider expanding segment criteria or improving offer attractiveness."
    );
  } else if (activationRate > 0.4) {
    recommendations.push(
      "✓ High activation rate detected. Campaign offers are well-targeted."
    );
  }

  // Check revenue projections
  if (projections.revenue > 2000000) {
    recommendations.push(
      "✓ Strong revenue projections. Campaign has high business impact potential."
    );
  }

  // Check for errors
  if (errors && errors.length > 0) {
    recommendations.push(
      `❌ Simulation failed with ${errors.length} error(s). Review and resolve before publishing.`
    );
  } else if (run.success) {
    recommendations.push("✓ Simulation completed successfully with no errors.");
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push(
      "Campaign simulation completed. Review metrics and proceed with confidence."
    );
  }

  return recommendations;
}

/**
 * Convert report data to downloadable JSON string
 */
export function serializeReport(reportData: ReportData): string {
  return JSON.stringify(reportData, null, 2);
}

