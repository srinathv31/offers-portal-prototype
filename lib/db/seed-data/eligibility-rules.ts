import { db } from "../index";
import * as schema from "../schema";

/**
 * Seed eligibility rules data
 * Creates rules with DSL expressions and data dependencies
 */
export async function seedEligibilityRules() {
  console.log("Creating eligibility rules...");

  const rulesData = [
    {
      dsl: "(account.status == 'ACTIVE') AND (account.delinquency_days < 30) AND (credit_score >= 650)",
      dataDependencies: [
        "account.status",
        "account.delinquency_days",
        "credit_score",
      ],
    },
    {
      dsl: "(account.tenure_months >= 6) AND (account.avg_monthly_spend >= 500) AND (opt_in.marketing == true)",
      dataDependencies: [
        "account.tenure_months",
        "account.avg_monthly_spend",
        "opt_in.marketing",
      ],
    },
  ];

  const createdRules = await db
    .insert(schema.eligibilityRules)
    .values(rulesData)
    .returning();

  console.log(`✓ Created ${createdRules.length} eligibility rules`);

  return createdRules;
}

