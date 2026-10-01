ALTER TABLE "member" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
-- The first-run welcome (D-021) is for members created from now on: everyone who already has an account is marked as having seen it.
UPDATE "member" SET "onboarded_at" = now() WHERE "onboarded_at" IS NULL;
