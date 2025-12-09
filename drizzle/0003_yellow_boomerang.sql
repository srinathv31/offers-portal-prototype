CREATE TYPE "public"."credit_card_product" AS ENUM('FLEXPAY', 'DOUBLE_UP', 'CASH_CREDIT', 'FIRST_CLASS', 'CLEAR');--> statement-breakpoint
CREATE TABLE "account_credit_cards" (
	"account_id" uuid NOT NULL,
	"credit_card_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"preferred_for_category" text
);
--> statement-breakpoint
CREATE TABLE "credit_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credit_card_product" "credit_card_product" NOT NULL,
	"card_number" text NOT NULL,
	"last_four_digits" text NOT NULL,
	"credit_limit" integer NOT NULL,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"opened_at" timestamp NOT NULL,
	"expiration_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_transactions" ADD COLUMN "credit_card_id" uuid;--> statement-breakpoint
ALTER TABLE "account_credit_cards" ADD CONSTRAINT "account_credit_cards_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_credit_cards" ADD CONSTRAINT "account_credit_cards_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_transactions" ADD CONSTRAINT "account_transactions_credit_card_id_credit_cards_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_cards"("id") ON DELETE no action ON UPDATE no action;