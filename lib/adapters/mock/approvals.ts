import { db } from "@/lib/db";
import {
  campaigns,
  approvals,
  auditLogs,
  type ControlResult,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface ControlChecklistItem {
  name: string;
  result: ControlResult;
  evidence_ref?: string;
}

interface ControlCheckResult {
  pass: boolean;
  summary: string;
  findings: ControlChecklistItem[];
}

interface ApprovalResult {
  allApproved: boolean;
  approvals: Array<{
    id: string;
    role: string;
    decision: string;
    actor?: string;
    timestamp?: Date;
  }>;
}

/**
 * Run automated control checks on a campaign before publish
 * Returns a checklist of control items with PASS/WARN/FAIL results
 */
export async function runAutoControls(
  campaignId: string
): Promise<ControlCheckResult> {
  console.log(`[Approvals] Running auto-controls for campaign: ${campaignId}`);

  const campaign = await db.query.campaigns.findFirst({
    where: (campaigns, { eq }) => eq(campaigns.id, campaignId),
    with: {
      controlChecklist: true,
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

  // Mock control checks (in production, these would be real validation rules)
  const findings: ControlChecklistItem[] = [
    {
      name: "PII Minimization",
      result: "PASS",
      evidence_ref: `pii-check-${Date.now()}`,
    },
    {
      name: "T&Cs Consistency Check",
      result: "PASS",
      evidence_ref: `tnc-check-${Date.now()}`,
    },
    {
      name: "7-Year Retention Compliance",
      result: "WARN",
      evidence_ref: `retention-check-${Date.now()}`,
    },
    {
      name: "Segregation of Duties (SoD)",
      result: "PASS",
      evidence_ref: `sod-check-${Date.now()}`,
    },
    {
      name: "Data Source Availability",
      result: "PASS",
      evidence_ref: `data-source-check-${Date.now()}`,
    },
  ];

  // Check if any critical failures
  const hasCriticalFailures = findings.some((f) => f.result === "FAIL");
  const hasWarnings = findings.some((f) => f.result === "WARN");

  const pass = !hasCriticalFailures;
  const summary = pass
    ? hasWarnings
      ? "Controls passed with warnings"
      : "All controls passed"
    : "Critical control failures detected";

  console.log(`[Approvals] Auto-controls result: ${summary}`);

  return {
    pass,
    summary,
    findings,
  };
}

/**
 * Trigger approval workflow for a campaign
 * In POC, this auto-approves. In production, would notify approvers.
 */
export async function triggerApprovals(
  campaignId: string
): Promise<ApprovalResult> {
  console.log(`[Approvals] Triggering approvals for campaign: ${campaignId}`);

  // Fetch existing approvals
  const existingApprovals = await db.query.approvals.findMany({
    where: (approvals, { eq }) => eq(approvals.campaignId, campaignId),
  });

  // For POC, auto-approve pending approvals
  const updatedApprovals = [];

  for (const approval of existingApprovals) {
    if (approval.decision === "PENDING") {
      // Auto-approve with mock actor
      const mockActor = getMockActorForRole(approval.role);

      await db
        .update(approvals)
        .set({
          decision: "APPROVED",
          actor: mockActor,
          timestamp: new Date(),
        })
        .where(eq(approvals.id, approval.id));

      updatedApprovals.push({
        ...approval,
        decision: "APPROVED" as const,
        actor: mockActor,
        timestamp: new Date(),
      });
    } else {
      updatedApprovals.push(approval);
    }
  }

  const allApproved = updatedApprovals.every((a) => a.decision === "APPROVED");

  console.log(`[Approvals] All approved: ${allApproved}`);

  return {
    allApproved,
    // @ts-expect-error - TODO: fix this
    approvals: updatedApprovals,
  };
}

/**
 * Publish a campaign (go live)
 * Updates status, creates audit entries
 */
export async function goLive(
  campaignId: string,
  actor: string = "system"
): Promise<void> {
  console.log(`[Approvals] Publishing campaign: ${campaignId}`);

  // Run controls first
  const controlResult = await runAutoControls(campaignId);

  if (!controlResult.pass) {
    throw new Error(`Cannot publish: ${controlResult.summary}`);
  }

  // Trigger approvals
  const approvalResult = await triggerApprovals(campaignId);

  if (!approvalResult.allApproved) {
    throw new Error("Cannot publish: Not all approvals are complete");
  }

  // Update campaign status to LIVE
  await db
    .update(campaigns)
    .set({
      status: "LIVE",
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  // Create audit log entries
  await db.insert(auditLogs).values([
    {
      campaignId,
      actor: "system",
      action: "AUTO_CONTROLS_PASSED",
      payload: {
        summary: controlResult.summary,
        findings: controlResult.findings,
      },
      timestamp: new Date(),
    },
    {
      campaignId,
      actor: "system",
      action: "APPROVALS_COMPLETED",
      payload: {
        approvals: approvalResult.approvals,
      },
      timestamp: new Date(),
    },
    {
      campaignId,
      actor,
      action: "CAMPAIGN_PUBLISHED",
      payload: {
        previousStatus: "IN_REVIEW",
        newStatus: "LIVE",
      },
      timestamp: new Date(),
    },
  ]);

  console.log(`[Approvals] Campaign ${campaignId} published successfully`);
}

/**
 * Get mock actor for a given approval role (for POC)
 */
function getMockActorForRole(role: string): string {
  const roleMap: Record<string, string> = {
    "Product Owner": "john.product@example.com",
    "Risk & Compliance": "lisa.compliance@example.com",
    "Marketing Ops": "sarah.marketing@example.com",
  };

  return roleMap[role] || "auto-approver@example.com";
}
