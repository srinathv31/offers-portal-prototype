CREATE TYPE "public"."account_status" AS ENUM('ACTIVE', 'SUSPENDED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."account_tier" AS ENUM('STANDARD', 'GOLD', 'PLATINUM', 'DIAMOND');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'OPTED_OUT');--> statement-breakpoint
CREATE TABLE "account_offer_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"campaign_id" uuid,
	"status" "enrollment_status" DEFAULT 'ENROLLED' NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"target_amount" integer,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"progress_pct" numeric(5, 2) DEFAULT '0' NOT NULL,
	"completed_at" timestamp,
	"reward_earned" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"enrollment_id" uuid,
	"transaction_date" timestamp NOT NULL,
	"merchant" text NOT NULL,
	"category" text NOT NULL,
	"amount" integer NOT NULL,
	"qualifies_for_offer" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_number" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"tier" "account_tier" DEFAULT 'STANDARD' NOT NULL,
	"status" "account_status" DEFAULT 'ACTIVE' NOT NULL,
	"credit_limit" integer NOT NULL,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"annual_spend" integer DEFAULT 0 NOT NULL,
	"member_since" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "segment_spending_groups" (
	"segment_id" uuid NOT NULL,
	"spending_group_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spending_group_accounts" (
	"spending_group_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"score" integer
);
--> statement-breakpoint
CREATE TABLE "spending_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"criteria" jsonb DEFAULT '{}'::jsonb,
	"account_count" integer DEFAULT 0 NOT NULL,
	"avg_spend" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "has_progress_tracking" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "progress_target" jsonb DEFAULT 'null'::jsonb;--> statement-breakpoint
ALTER TABLE "account_offer_enrollments" ADD CONSTRAINT "account_offer_enrollments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_offer_enrollments" ADD CONSTRAINT "account_offer_enrollments_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_offer_enrollments" ADD CONSTRAINT "account_offer_enrollments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_enrollment_id_account_offer_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."account_offer_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_spending_groups" ADD CONSTRAINT "segment_spending_groups_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_spending_groups" ADD CONSTRAINT "segment_spending_groups_spending_group_id_spending_groups_id_fk" FOREIGN KEY ("spending_group_id") REFERENCES "public"."spending_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_group_accounts" ADD CONSTRAINT "spending_group_accounts_spending_group_id_spending_groups_id_fk" FOREIGN KEY ("spending_group_id") REFERENCES "public"."spending_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spending_group_accounts" ADD CONSTRAINT "spending_group_accounts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;