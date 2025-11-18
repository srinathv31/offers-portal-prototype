/* eslint-disable @typescript-eslint/no-explicit-any */
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

const SIMULATION_STEPS: Array<{
  key: string;
  label: string;
  duration: number;
  shouldFail?: boolean;
}> = [
  { key: "rules-compile", label: "Rules Compilation", duration: 2000 },
  {
    key: "data-availability",
    label: "Data Availability Check",
    duration: 1500,
  },
  { key: "channel-mock", label: "Channel Distribution Mock", duration: 2500 },
  { key: "presentment", label: "Offer Presentment Simulation", duration: 3000 },
  { key: "disposition", label: "Disposition Processing", duration: 2000 },
  { key: "fulfillment", label: "Fulfillment Simulation", duration: 2500 },
  { key: "report", label: "Report Generation", duration: 1500 },
];

/**
 * Start a new simulation run for a campaign
 */
export async function startSimulation(
  campaignId: string
): Promise<SimulationRun> {
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
    const estimatedSize =
      (cs.segment.definitionJson as any)?.estimatedSize || 10000;
    return sum + estimatedSize;
  }, 0);

  // Initialize projections as empty - they will be calculated progressively
  const projections = {};

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
export async function getRunStatus(
  runId: string
): Promise<SimulationRun | null> {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
  });

  if (!run) {
    return null;
  }

  return run as SimulationRun;
}

/**
 * Update projections after specific steps complete
 * This creates the illusion of dynamic calculation
 */
async function updateProjectionsAfterStep(
  runId: string,
  stepIndex: number
): Promise<void> {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
  });

  if (!run) return;

  const cohortSize = run.cohortSize;
  const currentProjections = run.projections as Record<string, any>;
  let updatedProjections = { ...currentProjections };

  // Step 4 (Disposition Processing) - Calculate activations and revenue
  if (stepIndex === 4) {
    updatedProjections = {
      ...updatedProjections,
      // @ts-expect-error - TODO: fix this
      activations: Math.floor(cohortSize * 0.35 + Math.random() * 1000),
      // @ts-expect-error - TODO: fix this
      revenue: Math.floor(cohortSize * 0.35 * 85 + Math.random() * 100000),
    };
  }

  // Step 5 (Fulfillment Simulation) - Calculate error rate
  if (stepIndex === 5) {
    updatedProjections = {
      ...updatedProjections,
      error_rate_pct: Math.random() * 1.5,
    };
  }

  // Update projections in database if they changed
  if (
    Object.keys(updatedProjections).length >
    Object.keys(currentProjections).length
  ) {
    await db
      .update(simulationRuns)
      .set({
        projections: updatedProjections,
      })
      .where(eq(simulationRuns.id, runId));
  }
}

/**
 * Progress the simulation steps asynchronously
 * This simulates real processing with artificial delays
 */
async function progressSimulation(runId: string): Promise<void> {
  const steps = [...SIMULATION_STEPS];

  // Process steps sequentially with delays
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Update current step to RUNNING (all previous are DONE, current is RUNNING, rest are PENDING)
    await updateAllSteps(runId, i, "RUNNING");

    // Wait for step duration
    await new Promise((resolve) => setTimeout(resolve, step.duration));

    // Randomly fail at a very low rate (3% chance on non-critical steps)
    const shouldFail = step.shouldFail ?? Math.random() < 0.03;

    if (shouldFail) {
      // Mark step as failed
      await updateAllSteps(runId, i, "FAIL");

      // Add error and mark run as failed
      await db
        .update(simulationRuns)
        .set({
          errors: [
            {
              message: `Simulated error in ${step.label}`,
              step: step.key,
            },
          ],
          finished: true,
          success: false,
          finishedAt: new Date(),
        })
        .where(eq(simulationRuns.id, runId));

      simulationProgress.delete(runId);
      console.log(`[Simulation] Run ${runId} failed at step: ${step.label}`);
      return;
    }

    // Mark step as DONE
    await updateAllSteps(runId, i, "DONE");
    simulationProgress.set(runId, i + 1);

    // Progressively calculate projections after specific steps
    await updateProjectionsAfterStep(runId, i);
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
 * Update all steps to reflect the current progression state
 * All steps before currentIndex are DONE, currentIndex has currentStatus, rest are PENDING
 */
async function updateAllSteps(
  runId: string,
  currentIndex: number,
  currentStatus: StepStatus
): Promise<void> {
  const updatedSteps = SIMULATION_STEPS.map((step, idx) => ({
    key: step.key,
    label: step.label,
    status:
      idx < currentIndex
        ? ("DONE" as const)
        : idx === currentIndex
        ? currentStatus
        : ("PENDING" as const),
  }));

  await db
    .update(simulationRuns)
    .set({
      steps: updatedSteps,
    })
    .where(eq(simulationRuns.id, runId));
}
