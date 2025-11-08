CREATE TYPE "public"."approval_decision" AS ENUM('APPROVED', 'REJECTED', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'IN_REVIEW', 'TESTING', 'LIVE', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."control_result" AS ENUM('PASS', 'WARN', 'FAIL');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_method" AS ENUM('REWARDS', 'STATEMENT_CREDIT', 'INCENTIVE_FILE');--> statement-breakpoint
CREATE TYPE "public"."offer_type" AS ENUM('POINTS_MULTIPLIER', 'CASHBACK', 'DISCOUNT', 'BONUS');--> statement-breakpoint
CREATE TYPE "public"."segment_source" AS ENUM('CDC', 'RAHONA', 'CUSTOM');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"role" text NOT NULL,
	"actor" text,
	"decision" "approval_decision" DEFAULT 'PENDING' NOT NULL,
	"timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_eligibility_rules" (
	"campaign_id" uuid NOT NULL,
	"eligibility_rule_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_offers" (
	"campaign_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_segments" (
	"campaign_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"purpose" text NOT NULL,
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"owner_ids" jsonb DEFAULT '[]'::jsonb,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"channel_plan_id" uuid,
	"fulfillment_plan_id" uuid,
	"control_checklist_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb,
	"creatives" jsonb DEFAULT '[]'::jsonb,
	"dynamic_tnc" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eligibility_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dsl" text NOT NULL,
	"data_dependencies" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fulfillment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" "fulfillment_method" NOT NULL,
	"mock_adapter" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "offer_type" NOT NULL,
	"vendor" text,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"source" "segment_source" NOT NULL,
	"definition_json" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb,
	"cohort_size" jsonb,
	"projections" jsonb DEFAULT '{}'::jsonb,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"finished" boolean DEFAULT false NOT NULL,
	"success" boolean DEFAULT false,
	"errors" jsonb DEFAULT '[]'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_eligibility_rules" ADD CONSTRAINT "campaign_eligibility_rules_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_eligibility_rules" ADD CONSTRAINT "campaign_eligibility_rules_eligibility_rule_id_eligibility_rules_id_fk" FOREIGN KEY ("eligibility_rule_id") REFERENCES "public"."eligibility_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_offers" ADD CONSTRAINT "campaign_offers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_offers" ADD CONSTRAINT "campaign_offers_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_segments" ADD CONSTRAINT "campaign_segments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_segments" ADD CONSTRAINT "campaign_segments_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_runs" ADD CONSTRAINT "simulation_runs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;