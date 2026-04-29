CREATE TYPE "public"."wave_status" AS ENUM('PENDING', 'ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "campaign_waves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"rollout_pct" numeric(5, 2) NOT NULL,
	"customer_count" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" "wave_status" DEFAULT 'PENDING' NOT NULL,
	"plan_version" integer DEFAULT 1 NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_offer_enrollments" ADD COLUMN "wave_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_waves" ADD CONSTRAINT "campaign_waves_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_offer_enrollments" ADD CONSTRAINT "account_offer_enrollments_wave_id_campaign_waves_id_fk" FOREIGN KEY ("wave_id") REFERENCES "public"."campaign_waves"("id") ON DELETE set null ON UPDATE no action;