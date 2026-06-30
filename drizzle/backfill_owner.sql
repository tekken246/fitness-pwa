-- Run ONCE, after 0002_routine_ownership.sql.
-- Best-effort attribution of existing CUSTOM templates to the user who first logged a
-- session against any of their days. Seed templates stay NULL (is_seed = true).
--
-- Custom templates with NO sessions cannot be attributed; they remain owner = NULL,
-- which makes them invisible (not seed, not owned) and recoverable by setting the owner
-- manually. Review the inner SELECT before running if you have important orphan routines.
UPDATE "workout_templates" AS wt
SET "owner_clerk_user_id" = sub.owner
FROM (
  SELECT wtd."template_id" AS template_id,
         ws."clerk_user_id" AS owner,
         ROW_NUMBER() OVER (
           PARTITION BY wtd."template_id"
           ORDER BY ws."started_at" ASC
         ) AS rn
  FROM "workout_template_days" AS wtd
  JOIN "workout_sessions" AS ws ON ws."template_day_id" = wtd."id"
) AS sub
WHERE wt."id" = sub.template_id
  AND sub.rn = 1
  AND wt."is_seed" = false
  AND wt."owner_clerk_user_id" IS NULL;
