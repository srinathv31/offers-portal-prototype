/* eslint-disable @typescript-eslint/no-explicit-any */
import { db, getAccountsWithTransactionsForCampaign } from "@/lib/db";
import {
  simulationRuns,
  type AccountProjection,
  type SimulationProjections,
  type AccountTier,
  type ProjectionConfidence,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type StepStatus = "PENDING" | "RUNNING" | "DONE" | "FAIL";

interface SimulationStep {
  key: string;
  label: string;
  status: StepStatus;
}

export interface SpendStimSimulationRun {
  id: string;
  campaignId: string;
  simulationType: "SPEND_STIM";
  spendingGroupId: string | null;
  inputs: Record<string, any>;
  cohortSize: number;
  projections: SimulationProjections;
  steps: SimulationStep[];
  finished: boolean;
  success: boolean;
  errors: Array<{ message: string; step?: string }>;
  startedAt: Date;
  finishedAt?: Date | null;
}

interface AccountWithTransactions {
  id: string;
  firstName: string;
  lastName: string;
  tier: AccountTier;
  annualSpend: number;
  accountNumber: string;
  transactions: Array<{
    id: string;
    transactionDate: Date;
    amount: number;
    category: string;
    merchant: string;
  }>;
}

// Spend Stim specific simulation steps
const SPEND_STIM_STEPS: Array<{
  key: string;
  label: string;
  duration: number;
}> = [
  { key: "spending-group-analysis", label: "Spending Group Analysis", duration: 1500 },
  { key: "transaction-history", label: "Transaction History Analysis", duration: 2000 },
  { key: "baseline-calculation", label: "Baseline Calculation", duration: 1500 },
  { key: "lift-modeling", label: "Lift Modeling", duration: 2500 },
  { key: "per-account-projections", label: "Per-Account Projections", duration: 2000 },
  { key: "aggregate-results", label: "Aggregate Results", duration: 1000 },
];

// Tier-based lift multipliers
const TIER_LIFT_MULTIPLIERS: Record<AccountTier, number> = {
  STANDARD: 1.0,
  GOLD: 1.15,
  PLATINUM: 1.30,
  DIAMOND: 1.50,
};

// Base lift percentage range (will be adjusted by tier and spend history)
const BASE_LIFT_MIN = 0.08; // 8%
const BASE_LIFT_MAX = 0.25; // 25%

/**
 * Start a new Spend Stim simulation run for a campaign
 */
export async function startSpendStimSimulation(
  campaignId: string
): Promise<SpendStimSimulationRun> {
  console.log(`[SpendStim] Starting Spend Stim simulation for campaign: ${campaignId}`);

  // Fetch campaign with spending groups
  const { spendingGroups, accounts } = await getAccountsWithTransactionsForCampaign(
    campaignId,
    getDateNDaysAgo(90) // Last 90 days of transactions
  );

  if (spendingGroups.length === 0) {
    throw new Error(`Campaign ${campaignId} has no linked spending groups`);
  }

  const cohortSize = accounts.length;
  const primarySpendingGroupId = spendingGroups[0]?.id || null;

  // Create initial simulation run with all steps pending
  const initialSteps: SimulationStep[] = SPEND_STIM_STEPS.map((step) => ({
    key: step.key,
    label: step.label,
    status: "PENDING" as const,
  }));

  const [simulationRun] = await db
    .insert(simulationRuns)
    .values({
      campaignId,
      simulationType: "SPEND_STIM",
      spendingGroupId: primarySpendingGroupId,
      inputs: {
        spendingGroupCount: spendingGroups.length,
        accountCount: cohortSize,
        analysisWindow: "90 days",
        projectionWindow: "30 days",
      },
      cohortSize,
      projections: {},
      steps: initialSteps,
      finished: false,
      success: false,
      errors: [],
      startedAt: new Date(),
      finishedAt: null,
    })
    .returning();

  // Start async simulation progress
  progressSpendStimSimulation(simulationRun.id, accounts);

  return simulationRun as unknown as SpendStimSimulationRun;
}

/**
 * Get date N days ago
 */
function getDateNDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Calculate confidence level based on transaction count
 */
function getConfidenceLevel(transactionCount: number): ProjectionConfidence {
  if (transactionCount >= 20) return "HIGH";
  if (transactionCount >= 8) return "MEDIUM";
  return "LOW";
}

/**
 * Calculate spending by category from transactions
 */
function calculateCategoryBreakdown(
  transactions: AccountWithTransactions["transactions"]
): Record<string, number> {
  const breakdown: Record<string, number> = {};
  
  for (const tx of transactions) {
    const category = tx.category || "Other";
    breakdown[category] = (breakdown[category] || 0) + tx.amount;
  }
  
  return breakdown;
}

/**
 * Calculate monthly spend from transactions
 */
function calculateMonthlySpend(
  transactions: AccountWithTransactions["transactions"]
): number {
  const totalSpend = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  // Assuming transactions cover ~90 days, normalize to 30 days
  return Math.round(totalSpend / 3);
}

/**
 * Apply lift model to calculate projected spending
 */
function applyLiftModel(
  currentMonthlySpend: number,
  tier: AccountTier,
  transactionCount: number
): { projectedMonthlySpend: number; projectedLift: number; projectedLiftPct: number } {
  // Base lift percentage with some randomness
  const baseLift = BASE_LIFT_MIN + Math.random() * (BASE_LIFT_MAX - BASE_LIFT_MIN);
  
  // Apply tier multiplier
  const tierMultiplier = TIER_LIFT_MULTIPLIERS[tier];
  
  // Apply engagement factor based on transaction frequency
  const engagementFactor = Math.min(1 + (transactionCount / 30) * 0.1, 1.3);
  
  // Calculate final lift percentage
  const finalLiftPct = baseLift * tierMultiplier * engagementFactor;
  
  // Calculate projected values
  const projectedLift = Math.round(currentMonthlySpend * finalLiftPct);
  const projectedMonthlySpend = currentMonthlySpend + projectedLift;
  
  return {
    projectedMonthlySpend,
    projectedLift,
    projectedLiftPct: finalLiftPct * 100,
  };
}

/**
 * Generate account projection from account data and transactions
 */
function generateAccountProjection(
  account: AccountWithTransactions
): AccountProjection {
  const currentMonthlySpend = calculateMonthlySpend(account.transactions);
  const categoryBreakdown = calculateCategoryBreakdown(account.transactions);
  const confidence = getConfidenceLevel(account.transactions.length);
  
  const { projectedMonthlySpend, projectedLift, projectedLiftPct } = applyLiftModel(
    currentMonthlySpend,
    account.tier,
    account.transactions.length
  );
  
  return {
    accountId: account.id,
    accountName: `${account.firstName} ${account.lastName}`,
    tier: account.tier,
    currentMonthlySpend,
    projectedMonthlySpend,
    projectedLift,
    projectedLiftPct: Math.round(projectedLiftPct * 10) / 10, // Round to 1 decimal
    categoryBreakdown,
    confidence,
  };
}

/**
 * Progress the Spend Stim simulation steps asynchronously
 */
async function progressSpendStimSimulation(
  runId: string,
  accounts: AccountWithTransactions[]
): Promise<void> {
  const steps = [...SPEND_STIM_STEPS];
  let accountProjections: AccountProjection[] = [];

  // Process steps sequentially with delays
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Update current step to RUNNING
    await updateAllSpendStimSteps(runId, i, "RUNNING");

    // Wait for step duration
    await new Promise((resolve) => setTimeout(resolve, step.duration));

    // Perform step-specific logic
    try {
      switch (step.key) {
        case "spending-group-analysis":
          // Validation step - already done before starting
          console.log(`[SpendStim] Analyzed ${accounts.length} accounts`);
          break;

        case "transaction-history":
          // Log transaction analysis
          const totalTransactions = accounts.reduce(
            (sum, a) => sum + a.transactions.length,
            0
          );
          console.log(`[SpendStim] Analyzed ${totalTransactions} transactions`);
          break;

        case "baseline-calculation":
          // Calculate baselines (will be done in per-account step)
          console.log(`[SpendStim] Calculated baselines for ${accounts.length} accounts`);
          break;

        case "lift-modeling":
          // Modeling step - prepare for projections
          console.log(`[SpendStim] Applied lift model`);
          break;

        case "per-account-projections":
          // Generate projections for each account
          accountProjections = accounts.map((account) =>
            generateAccountProjection(account)
          );
          
          // Update with per-account projections
          await db
            .update(simulationRuns)
            .set({
              projections: {
                accountProjections,
              } as SimulationProjections,
            })
            .where(eq(simulationRuns.id, runId));
          
          console.log(`[SpendStim] Generated ${accountProjections.length} account projections`);
          break;

        case "aggregate-results":
          // Calculate aggregate metrics
          const totalCurrentSpend = accountProjections.reduce(
            (sum, p) => sum + p.currentMonthlySpend,
            0
          );
          const totalProjectedSpend = accountProjections.reduce(
            (sum, p) => sum + p.projectedMonthlySpend,
            0
          );
          const avgLiftPct =
            accountProjections.length > 0
              ? accountProjections.reduce((sum, p) => sum + p.projectedLiftPct, 0) /
                accountProjections.length
              : 0;
          
          // Calculate revenue and activations for compatibility with existing metrics
          const projectedRevenue = totalProjectedSpend - totalCurrentSpend;
          const activations = Math.floor(
            accountProjections.filter((p) => p.confidence !== "LOW").length * 0.8
          );

          // Update with full projections
          await db
            .update(simulationRuns)
            .set({
              projections: {
                // E2E compatible fields
                revenue: projectedRevenue,
                activations,
                error_rate_pct: Math.random() * 0.5, // Very low error rate
                // Spend Stim specific fields
                accountProjections,
                totalCurrentSpend,
                totalProjectedSpend,
                avgLiftPct: Math.round(avgLiftPct * 10) / 10,
              } as SimulationProjections,
            })
            .where(eq(simulationRuns.id, runId));
          
          console.log(`[SpendStim] Aggregated results - Total projected lift: $${(projectedRevenue / 100).toLocaleString()}`);
          break;
      }

      // Mark step as DONE
      await updateAllSpendStimSteps(runId, i, "DONE");
    } catch (error) {
      console.error(`[SpendStim] Error in step ${step.key}:`, error);
      
      // Mark step as failed
      await updateAllSpendStimSteps(runId, i, "FAIL");

      // Add error and mark run as failed
      await db
        .update(simulationRuns)
        .set({
          errors: [
            {
              message: error instanceof Error ? error.message : `Error in ${step.label}`,
              step: step.key,
            },
          ],
          finished: true,
          success: false,
          finishedAt: new Date(),
        })
        .where(eq(simulationRuns.id, runId));

      console.log(`[SpendStim] Run ${runId} failed at step: ${step.label}`);
      return;
    }
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

  console.log(`[SpendStim] Run ${runId} completed successfully`);
}

/**
 * Update all steps to reflect the current progression state
 */
async function updateAllSpendStimSteps(
  runId: string,
  currentIndex: number,
  currentStatus: StepStatus
): Promise<void> {
  const updatedSteps = SPEND_STIM_STEPS.map((step, idx) => ({
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

/**
 * Get the current status of a Spend Stim simulation run
 */
export async function getSpendStimRunStatus(
  runId: string
): Promise<SpendStimSimulationRun | null> {
  const run = await db.query.simulationRuns.findFirst({
    where: (runs, { eq }) => eq(runs.id, runId),
  });

  if (!run || run.simulationType !== "SPEND_STIM") {
    return null;
  }

  return run as unknown as SpendStimSimulationRun;
}

