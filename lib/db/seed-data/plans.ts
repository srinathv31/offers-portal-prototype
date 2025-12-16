import { db } from "../index";
import * as schema from "../schema";

/**
 * Seed plans data (channel plans, fulfillment plans, and control checklists)
 */
export async function seedPlans() {
  // Create channel plan
  console.log("Creating channel plan...");
  const channelPlanData = {
    channels: ["EMAIL", "MOBILE", "WEB"],
    creatives: [
      {
        channel: "EMAIL",
        preview:
          "Holiday rewards are here! Earn 3× points on your favorite brands.",
      },
      {
        channel: "MOBILE",
        preview:
          "🎁 Special Holiday Offer: Triple points on Amazon, Target & more!",
      },
      {
        channel: "WEB",
        preview: "Banner: Exclusive Holiday Rewards - Limited Time Only",
      },
    ],
    dynamicTnc:
      "Offer valid through 12/31/2025. Points earned will post within 2 billing cycles. See full terms at example.com/terms.",
  };

  const [channelPlan] = await db
    .insert(schema.channelPlans)
    .values(channelPlanData)
    .returning();
  console.log("✓ Created channel plan");

  // Create fulfillment plan
  console.log("Creating fulfillment plan...");
  const fulfillmentPlanData = {
    method: "REWARDS" as const,
    mockAdapter: "REWARDS_ENGINE",
  };

  const [fulfillmentPlan] = await db
    .insert(schema.fulfillmentPlans)
    .values(fulfillmentPlanData)
    .returning();
  console.log("✓ Created fulfillment plan");

  // Create control checklist
  console.log("Creating control checklist...");
  const controlChecklistData = {
    items: [
      {
        name: "PII Minimization",
        result: "PASS" as const,
        evidence_ref: "privacy-audit-2025-001",
      },
      {
        name: "T&Cs Consistency Check",
        result: "PASS" as const,
        evidence_ref: "legal-review-2025-002",
      },
      {
        name: "7-Year Retention Compliance",
        result: "WARN" as const,
        evidence_ref: "retention-policy-check",
      },
      {
        name: "Segregation of Duties (SoD)",
        result: "PASS" as const,
        evidence_ref: "sod-matrix-verified",
      },
      {
        name: "Data Source Availability",
        result: "PASS" as const,
        evidence_ref: "data-lineage-check-2025",
      },
    ],
  };

  const [controlChecklist] = await db
    .insert(schema.controlChecklists)
    .values(controlChecklistData)
    .returning();
  console.log("✓ Created control checklist");

  return { channelPlan, fulfillmentPlan, controlChecklist };
}

