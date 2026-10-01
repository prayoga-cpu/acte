CREATE TABLE IF NOT EXISTS "feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"firm_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "theme" text DEFAULT 'dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "alert_emails" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "rate_cents" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "notification" ADD COLUMN "emailed_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_firm_id_firm_id_fk" FOREIGN KEY ("firm_id") REFERENCES "public"."firm"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feedback" ADD CONSTRAINT "feedback_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task" ADD CONSTRAINT "task_invoice_id_client_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."client_invoice"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "client_invoice_firm_number_uniq" ON "client_invoice" USING btree ("firm_id","number");--> statement-breakpoint
-- D-020: validated time keeps the rate it was validated at. Time validated before this column existed takes its author's rate as of this migration.
UPDATE "task" SET "rate_cents" = "member"."hourly_rate_cents" FROM "member" WHERE "task"."member_id" = "member"."id" AND "task"."status" = 'validated' AND "task"."rate_cents" IS NULL;
--> statement-breakpoint
-- D-020: an existing draft billed all of its dossier's validated time, so that time is attached to the earliest draft that followed it and can't be billed again.
UPDATE "task" SET "invoice_id" = (
	SELECT "client_invoice"."id" FROM "client_invoice"
	WHERE "client_invoice"."dossier_id" = "task"."dossier_id" AND "client_invoice"."created_at" >= "task"."validated_at"
	ORDER BY "client_invoice"."created_at" LIMIT 1
) WHERE "task"."status" = 'validated' AND "task"."invoice_id" IS NULL AND "task"."validated_at" IS NOT NULL;
--> statement-breakpoint
-- D-017: sign-in now requires a verified email. Accounts created before verification existed are kept usable rather than locked out (synthetic beta data only; no real firm has an account yet).
UPDATE "user" SET "email_verified" = true WHERE "email_verified" = false;
