import { getSimulationRunById } from "@/lib/db/queries/simulations";
import { getCampaignById } from "@/lib/db/queries/campaigns";

export async function buildReport(runId: string): Promise<string> {
  const run = await getSimulationRunById(runId);
  
  if (!run) {
    throw new Error(`Simulation run ${runId} not found`);
  }

  const campaign = await getCampaignById(run.campaignId);

  const report = {
    simulationRunId: run.id,
    campaignId: run.campaignId,
    campaignName: campaign?.name || "Unknown",
    generatedAt: new Date().toISOString(),
    inputs: run.inputs,
    cohortSize: run.cohortSize,
    projections: run.projections,
    steps: run.steps,
    success: run.success,
    errors: run.errors,
    duration: run.finishedAt && run.startedAt
      ? Math.round(
          (run.finishedAt.getTime() - run.startedAt.getTime()) / 1000
        )
      : null,
  };

  return JSON.stringify(report, null, 2);
}

