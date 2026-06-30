-- Routine ownership: private routines + read-only seed.
-- NULL owner is reserved for the shared seed plan (is_seed = true).
ALTER TABLE "workout_templates" ADD COLUMN "owner_clerk_user_id" text;--> statement-breakpoint
CREATE INDEX "idx_workout_templates_owner" ON "workout_templates" USING btree ("owner_clerk_user_id");
