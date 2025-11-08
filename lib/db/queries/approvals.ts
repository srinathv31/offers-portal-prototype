import { db } from "../index";
import { approvals } from "../schema";
import { eq, and } from "drizzle-orm";

export async function getApprovalsByCampaignId(campaignId: string) {
  return await db
    .select()
    .from(approvals)
    .where(eq(approvals.campaignId, campaignId));
}

export async function createApproval(data: {
  campaignId: string;
  role: string;
  actor?: string;
  decision?: "APPROVED" | "REJECTED" | "PENDING";
}) {
  const [approval] = await db
    .insert(approvals)
    .values({
      campaignId: data.campaignId,
      role: data.role,
      actor: data.actor,
      decision: data.decision || "PENDING",
      timestamp: data.decision !== "PENDING" ? new Date() : undefined,
    })
    .returning();

  return approval;
}

export async function updateApproval(
  id: string,
  data: {
    decision: "APPROVED" | "REJECTED" | "PENDING";
    actor?: string;
  }
) {
  const [updated] = await db
    .update(approvals)
    .set({
      decision: data.decision,
      actor: data.actor,
      timestamp: data.decision !== "PENDING" ? new Date() : undefined,
    })
    .where(eq(approvals.id, id))
    .returning();

  return updated;
}

export async function checkAllApprovalsComplete(campaignId: string) {
  const campaignApprovals = await getApprovalsByCampaignId(campaignId);

  if (campaignApprovals.length === 0) {
    return false;
  }

  return campaignApprovals.every(
    (approval) => approval.decision === "APPROVED"
  );
}
