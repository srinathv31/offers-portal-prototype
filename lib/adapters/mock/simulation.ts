import {
  createSimulationRun,
  getSimulationRunById,
  updateSimulationRun,
} from "@/lib/db/queries/simulations";

const SIMULATION_STEPS = [
  { key: "rules-compile", label: "Rules Compilation", duration: 2000 },
  { key: "data-availability", label: "Data Availability Check", duration: 1500 },
  { key: "channel-mock", label: "Channel Mock", duration: 2500 },
  { key: "presentment", label: "Presentment", duration: 3000 },
  { key: "disposition", label: "Disposition", duration: 2000 },
  { key: "fulfillment", label: "Fulfillment", duration: 2500 },
  { key: "report", label: "Report Generation", duration: 1500 },
];

export async function startSimulation(campaignId: string) {
  const run = await createSimulationRun({
    campaignId,
    inputs: { campaignId },
    cohortSize: Math.floor(Math.random() * 5000) + 1000,
  });

  // Start simulation asynchronously
  simulateAsync(run.id).catch(console.error);

  return run;
}

async function simulateAsync(runId: string) {
  const steps = [...SIMULATION_STEPS];
  
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Update current step to RUNNING
    await updateSimulationRun(runId, {
      steps: steps.map((s, idx) => ({
        key: s.key,
        label: s.label,
        status:
          idx < i ? "DONE" : idx === i ? "RUNNING" : "PENDING",
      })),
    });

    // Simulate step duration
    await new Promise((resolve) => setTimeout(resolve, step.duration));

    // Update step to DONE
    await updateSimulationRun(runId, {
      steps: steps.map((s, idx) => ({
        key: s.key,
        label: s.label,
        status: idx <= i ? "DONE" : "PENDING",
      })),
    });
  }

  // Generate projections
  const revenue = Math.floor(Math.random() * 200000) + 50000;
  const errorRate = Math.random() * 2; // 0-2%

  await updateSimulationRun(runId, {
    projections: {
      revenue,
      errorRate,
    },
    finished: true,
    success: true,
  });
}

export async function getRunStatus(runId: string) {
  return await getSimulationRunById(runId);
}

