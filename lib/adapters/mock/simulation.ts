import { db } from "@/lib/db";
import { simulationRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type StepStatus = "PENDING" | "RUNNING" | "DONE" | "FAIL";

interface SimulationStep {
  key: string;
  label: string;
  status: StepStatus;
}

interface SimulationRun {
  id: string;
  campaignId: string;
  inputs: Record<string, any>;
  cohortSize: number;
  projections: {
    revenue?: number;
    activations?: number;
    error_rate_pct?: number;
  };
  steps: SimulationStep[];
  finished: boolean;
  success: boolean;
  errors: Array<{ message: string; step?: string }>;
  startedAt: Date;
  finishedAt?: Date | null;
}

// In-memory storage for simulation progress (for POC)
// In production, this would be in Redis or similar
const simulationProgress = new Map<string, number>();

const SIMULATION_STEPS: Array<{ key: string; label: string }> = [
  { key: "rules-compile", label: "Rules Compilation" },
  { key: "data-availability", label: "Data Availability Check" },
  { key: "channel-mock", label: "Channel Distribution Mock" },
  { key: "presentment", label: "Offer Presentment Simulation" },
  { key: "disposition", label: "Disposition Processing" },
  { key: "fulfillment", label: "Fulfillment Simulation" },
  { key: "report", label: "Report Generation" },
];

const STEP_DELAY_MS = 500; // Artificial delay per step

/**
 * Start a new simulation run for a campaign
 */
export async function startSimulation(campaignId: string): Promise<SimulationRun> {
  console.log(`[Simulation] Starting simulation for campaign: ${campaignId}`);

  // Fetch campaign data
  const campaign = await db.query.campaigns.findFirst({
    where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
    with: {
      campaignOffers: {
        with: { offer: true },
      },
      campaignSegments: {
        with: { segment: true },
      },
    },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Calculate cohort size from segments
  const cohortSize = campaign.campaignSegments.reduce((sum, cs) => {
    const estimatedSize = (cs.segment.definitionJson as any)?.estimatedSize || 10000;
    return sum + estimatedSize;
  }, 0);

  // Generate projections based on campaign offers
  const projections = {
    revenue: Math.floor(cohortSize * 0.35 * 85 + Math.random() * 100000),
    activations: Math.floor(cohortSize * 0.35 + Math.random() * 1000),
    error_rate_pct: Math.random() * 1.5,
  };

  // Create initial simulation run with all steps pending
  const initialSteps: SimulationStep[] = SIMULATION_STEPS.map((step) => ({
    ...step,
    status: "PENDING" as const,
  }));

  const [simulationRun] = await db
    .insert(simulationRuns)
    .values({
      campaignId,
      inputs: {
        cohortSize,
        testPercentage: 10,
        duration: "30 days",
      },
      cohortSize,
      projections,
      steps: initialSteps,
      finished: false,
      success: false,
      errors: [],
      startedAt: new Date(),
      finishedAt: null,
    })
    .returning();

  // Initialize progress tracker
  simulationProgress.set(simulationRun.id, 0);

  // Start async simulation progress
  progressSimulation(simulationRun.id);

  return simulationRun as SimulationRun;
}

/**
 * Get the current status of a simulation run
 */
export async function getRunStatus(runId: string): Promise<SimulationRun | null> {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
  });

  if (!run) {
    return null;
  }

  return run as SimulationRun;
}

/**
 * Progress the simulation steps asynchronously
 * This simulates real processing with artificial delays
 */
async function progressSimulation(runId: string): Promise<void> {
  const totalSteps = SIMULATION_STEPS.length;
  let currentStep = simulationProgress.get(runId) || 0;

  // Process steps sequentially with delays
  for (let i = currentStep; i < totalSteps; i++) {
    // Wait for artificial delay
    await new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS));

    // Update step to RUNNING
    await updateStepStatus(runId, i, "RUNNING");

    // Small delay for running state
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Randomly fail at a very low rate (5% chance on non-critical steps)
    const shouldFail = Math.random() < 0.05 && i > 2;

    if (shouldFail) {
      // Mark step as failed
      await updateStepStatus(runId, i, "FAIL");

      // Add error
      await db
        .update(simulationRuns)
        .set({
          errors: [
            {
              message: `Simulated error in ${SIMULATION_STEPS[i].label}`,
              step: SIMULATION_STEPS[i].key,
            },
          ],
          finished: true,
          success: false,
          finishedAt: new Date(),
        })
        .where(eq(simulationRuns.id, runId));

      simulationProgress.delete(runId);
      console.log(`[Simulation] Run ${runId} failed at step: ${SIMULATION_STEPS[i].label}`);
      return;
    }

    // Mark step as done
    await updateStepStatus(runId, i, "DONE");
    simulationProgress.set(runId, i + 1);
  }

  // All steps completed successfully
  await db
    .update(simulationRuns)
    .set({
      finished: true,
      success: true,
      finishedAt: new Date(),
    })
    .where(eq(simulationRuns.id, runId));

  simulationProgress.delete(runId);
  console.log(`[Simulation] Run ${runId} completed successfully`);
}

/**
 * Update the status of a specific step in the simulation
 */
async function updateStepStatus(
  runId: string,
  stepIndex: number,
  status: StepStatus
): Promise<void> {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
  });

  if (!run) {
    return;
  }

  const updatedSteps = [...(run.steps as SimulationStep[])];
  updatedSteps[stepIndex] = {
    ...updatedSteps[stepIndex],
    status,
  };

  await db
    .update(simulationRuns)
    .set({
      steps: updatedSteps,
    })
    .where(eq(simulationRuns.id, runId));
}

