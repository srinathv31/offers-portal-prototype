import { db } from "../index";
import { simulationRuns } from "../schema";
import { eq } from "drizzle-orm";

export async function createSimulationRun(data: {
  campaignId: string;
  inputs?: Record<string, unknown>;
  cohortSize?: number;
}) {
  const [run] = await db
    .insert(simulationRuns)
    .values({
      campaignId: data.campaignId,
      inputs: data.inputs || {},
      cohortSize: data.cohortSize,
      steps: [
        { key: "rules-compile", label: "Rules Compilation", status: "PENDING" },
        { key: "data-availability", label: "Data Availability Check", status: "PENDING" },
        { key: "channel-mock", label: "Channel Mock", status: "PENDING" },
        { key: "presentment", label: "Presentment", status: "PENDING" },
        { key: "disposition", label: "Disposition", status: "PENDING" },
        { key: "fulfillment", label: "Fulfillment", status: "PENDING" },
        { key: "report", label: "Report Generation", status: "PENDING" },
      ],
    })
    .returning();

  return run;
}

export async function getSimulationRunById(id: string) {
  return await db.query.simulationRuns.findFirst({
    where: eq(simulationRuns.id, id),
  });
}

export async function updateSimulationRun(
  id: string,
  data: {
    steps?: Array<{ key: string; label: string; status: "PENDING" | "RUNNING" | "DONE" | "FAIL" }>;
    projections?: { revenue?: number; errorRate?: number };
    finished?: boolean;
    success?: boolean;
    errors?: unknown[];
  }
) {
  const [updated] = await db
    .update(simulationRuns)
    .set({
      ...data,
      finishedAt: data.finished ? new Date() : undefined,
    })
    .where(eq(simulationRuns.id, id))
    .returning();

  return updated;
}

