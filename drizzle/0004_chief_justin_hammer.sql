CREATE TYPE "public"."simulation_type" AS ENUM('E2E_TEST', 'SPEND_STIM');--> statement-breakpoint
ALTER TABLE "simulation_runs" ADD COLUMN "simulation_type" "simulation_type" DEFAULT 'E2E_TEST' NOT NULL;--> statement-breakpoint
ALTER TABLE "simulation_runs" ADD COLUMN "spending_group_id" uuid;--> statement-breakpoint
ALTER TABLE "simulation_runs" ADD CONSTRAINT "simulation_runs_spending_group_id_spending_groups_id_fk" FOREIGN KEY ("spending_group_id") REFERENCES "public"."spending_groups"("id") ON DELETE no action ON UPDATE no action;