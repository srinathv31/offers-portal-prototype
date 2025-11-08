import { db } from "@/lib/db/index";
import { controlChecklists, campaigns, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createApproval,
  getApprovalsByCampaignId,
  checkAllApprovalsComplete,
} from "@/lib/db/queries/approvals";
import { updateCampaignStatus } from "@/lib/db/queries/campaigns";

export interface ControlChecklistItem {
  name: string;
  result: "PASS" | "WARN" | "FAIL";
  evidenceRef?: string;
}

export async function runAutoControls(campaignId: string): Promise<{
  pass: boolean;
  summary: string;
  findings: ControlChecklistItem[];
}> {
  // Mock control checks
  const findings: ControlChecklistItem[] = [
    {
      name: "PII Minimization",
      result: "PASS",
      evidenceRef: "policy_v2.1",
    },
    {
      name: "T&Cs Consistency",
      result: "PASS",
      evidenceRef: "legal_review_2024-11",
    },
    {
      name: "7-Year Retention Warning",
      result: "WARN",
      evidenceRef: "retention_policy",
    },
    {
      name: "Separation of Duties",
      result: "PASS",
      evidenceRef: "sod_matrix",
    },
  ];

  const pass = findings.every((item) => item.result !== "FAIL");

  // Store checklist
  const [checklist] = await db
    .insert(controlChecklists)
    .values({ items: findings })
    .returning();

  // Update campaign with checklist
  await db
    .update(campaigns)
    .set({ controlChecklistId: checklist.id })
    .where(eq(campaigns.id, campaignId));

  // Create audit log
  await db.insert(auditLogs).values({
    campaignId,
    actor: "system",
    action: "AUTO_CONTROLS_RUN",
    payload: { pass, findings },
  });

  return {
    pass,
    summary: pass
      ? "All critical controls passed"
      : "Some controls failed - review required",
    findings,
  };
}

export async function triggerApprovals(campaignId: string): Promise<{
  allApproved: boolean;
  approvals: Array<{
    id: string;
    role: string;
    decision: "APPROVED" | "REJECTED" | "PENDING";
    actor?: string;
  }>;
}> {
  // Create default approval records
  const roles = ["Product Owner", "Risk/Compliance", "Marketing Ops"];

  for (const role of roles) {
    const existing = await getApprovalsByCampaignId(campaignId);
    if (!existing.some((a) => a.role === role)) {
      await createApproval({
        campaignId,
        role,
        decision: "PENDING",
      });
    }
  }

  const allApprovals = await getApprovalsByCampaignId(campaignId);

  return {
    allApproved: await checkAllApprovalsComplete(campaignId),
    approvals: allApprovals.map((a) => ({
      id: a.id,
      role: a.role,
      decision: a.decision as "APPROVED" | "REJECTED" | "PENDING",
      actor: a.actor || undefined,
    })),
  };
}

export async function goLive(campaignId: string): Promise<void> {
  await updateCampaignStatus(campaignId, "LIVE");

  await db.insert(auditLogs).values({
    campaignId,
    actor: "system",
    action: "CAMPAIGN_GO_LIVE",
    payload: { timestamp: new Date().toISOString() },
  });
}

