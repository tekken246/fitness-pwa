# Fit Track — Security Patch Integration Guide

Fixes findings #2, #3, #4, #6, #7, #8, #9, #12. **Finding #1 (committed secrets) is intentionally untouched — handle key rotation + `.gitignore` yourself.** #5 (test secrets) is part of that same secrets bucket and is also left to you. #10 and #11 are left as-is on purpose (see bottom).

The `patch/` tree mirrors the repo. Copy files over the originals (or apply as a diff). No file outside this list changes.

## Apply

```bash
# 1. Remove the orphan migration (not in the journal, superseded by 0000_slow_overlord)
git rm drizzle/0000_initial_schema.sql

# 2. Copy the patch over your repo (preserves paths)
cp -R patch/. .

# 3. Install the new deps (Upstash rate limiter)
npm install
```

## Database

You applied the seed migration (`0001_seed_workout_template.sql`) manually, so do the same here — **do not** run `drizzle-kit generate`/`db:generate`, because the next auto index is `0001_*` and would collide with the seed file name and the journal.

Apply directly to Neon, in order:

```bash
psql "$DATABASE_URL" -f drizzle/0002_routine_ownership.sql   # adds owner_clerk_user_id + index
psql "$DATABASE_URL" -f drizzle/backfill_owner.sql           # run ONCE, best-effort owner backfill
psql "$DATABASE_URL" -f drizzle/0003_set_kind.sql            # adds set_entries.kind (default 'working')
```

`schema.ts` now matches the DB, so future diffs stay clean. The backfill attributes each existing custom routine to the user who first logged against it; custom routines with no sessions stay `owner = NULL` → hidden (not seed, not owned) and recoverable by setting the owner by hand. Seed stays `is_seed = true`.

## Rate limiting (Upstash) — optional env, zero-config default

`enforceRateLimit` is a no-op until these are set, so it deploys immediately and starts enforcing the moment you add them (Vercel → project env, or `.env.local`):

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Create a free Upstash Redis DB (or add the Upstash integration from the Vercel marketplace — Vercel KV is Upstash under the hood). Sliding-window limits: routine writes 20/min, workout start 30/min, session autosave 120/min (generous so logging is never blocked).

## CSP — ships Report-Only, you flip to enforce

`next.config.ts` sends `Content-Security-Policy-Report-Only` with a Clerk + Google + Cloudflare-Turnstile allowlist. Nothing breaks while it's report-only. To enforce:

1. Deploy, open the app, sign in with **email and Google**, exercise every page (DevTools console open).
2. If a host shows up in a CSP violation (e.g. your prod Clerk Frontend API `https://clerk.<your-domain>`), add it to the matching directive in `csp`.
3. When the console is clean, rename the header key `Content-Security-Policy-Report-Only` → `Content-Security-Policy`.

HSTS is sent in production only. `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` apply everywhere.

## What changed, per finding

- **#2 routine IDOR / broken tenancy** — `workout_templates.owner_clerk_user_id` (NULL = seed). New `src/lib/data/routine-access.ts`: `getUsableTemplateDay` (seed **or** owned, for reads/start) and `assertEditableTemplateDay` (owned **and** not seed, for writes). `workout-templates.ts` split into `getSeedWeeklyPlan()` + `getRoutinesForUser(userId)`; `getTemplateDayDetail` now requires the user and authorizes. Every routine/builder page + the start action is gated. Seed is read-only for everyone. Visibility rule: `is_seed OR owner = userId`; editability: `owner = userId AND NOT is_seed`. (Discriminating the seed by `is_seed` rather than null-owner means orphan customs stay hidden, never exposed.)
- **#3 cross-tenant session delete** — `deleteFlexibleRoutineAction` authorizes via `assertEditableTemplateDay`, derives `templateId` server-side (form value ignored), and deletes **only the caller's** sessions (`templateDayId = day AND clerkUserId = me`). `removeExerciseFromRoutineAction` is constrained to `assignmentId AND dayId`.
- **#4 no rate limiting** — `src/lib/rate-limit.ts` on all destructive/mutating actions.
- **#6 migration collision** — orphan `0000_initial_schema.sql` deleted; journal already pointed only at `0000_slow_overlord` (which has nullable `day_of_week` + `folder_id`, so there was no drift). One additive migration added.
- **#7 unbounded `exerciseNotes`** — `.refine(keys ≤ 100)` in `syncWorkoutDraftSchema`.
- **#8 missing headers/CSP** — `next.config.ts` (see above).
- **#9 error leakage** — `toErrorMessage` returns a generic string for non-`AppError` and logs the real error server-side.
- **#12 SW caching** — per-deploy cache key; same-origin GET only; skips `/api`, `/_next/data`, and `?_rsc`; caches only `/icons/`.

### Left as-is (intentional)
- **#10 redundant ownership re-check in the session data layer** — kept as defense-in-depth.
- **#11 theme cookie not `httpOnly`** — needs to be readable for first-paint theming; not a security boundary.

## Verify

```bash
npm run typecheck   # or: npx tsc --noEmit
npm run lint
npm run build
npm test            # progress.ts unit tests still pass
```

Manual multi-tenancy check (the bug that mattered): as user A, copy a routine's `dayId`; as user B, hit `GET /workouts/<dayId>/edit`, `GET /workouts/<dayId>`, and POST the start/delete/add/remove actions with that `dayId`. All must be denied (not_found/forbidden). Seed days remain viewable and startable by everyone but never editable or deletable.

---

# Enhancements (Tier 0 + Tier 1)

Layered on top of the security patch in the same tree. **One additive, data-safe schema change** (`set_entries.kind`, migration `0003`); everything else is code or device-local (localStorage) UX prefs.

## What shipped

- **0.1 Exercise substitution** — in-workout "Swap" on each exercise opens a searchable catalogue sheet; the entry's `selected_exercise_id` is updated server-side (ownership-scoped). The card's name, help sheet, and measurement follow the performed exercise. Previous-performance and progress key off the performed exercise.
- **0.2 RPE** — per-set RPE input (0–10, 0.5 steps). Persists through the existing autosave path.
- **1.1 Use previous** — the "Previous" chip gets a one-tap **Use** that fills every not-yet-completed set with last session's weight/reps.
- **1.2 Weight steppers** — −/+ on each weight field (kg 2.5 / lb 5 / other 1).
- **1.3 Add / remove sets mid-workout** — "Add set" per exercise; a trash control per set (hidden when only one set remains). Both hit ownership-scoped server actions and update the entry's sets.
- **1.4 Countdown rest timer** — the per-set timer now counts **down** from a target (default 120 s, adjustable in the session header, persisted in localStorage) and buzzes once (`navigator.vibrate`) when the target is hit. Completed-with-next-set rows show the rest actually taken.
- **1.5 Plate calculator** — per-set calculator sheet; greedy per-side plate breakdown; bar weight adjustable and persisted per unit (default kg 20 / lb 45).
- **1.6 Warm-up vs working sets** — per-set **Warm-up** toggle (`set_entries.kind`); warm-ups are excluded from volume / best-weight / 1RM / trend math in `progress.ts`.
- **1.7 Real duration estimate** — Today's card replaces the hardcoded "~45 min" with the rolling average of the user's last 20 completed sessions (falls back to `exercises × 8 min`).

## New / changed files (enhancements)

New: `src/components/workout/use-workout-prefs.ts` (rest pref hook), `plate-calculator.tsx`, `exercise-swap-sheet.tsx`. Changed: `src/db/schema.ts` (+`kind`), `src/lib/types.ts` (`SetKind`, `kind` on `SetEntryView`/`SetDraft`, `ExerciseCatalogItem`), `src/lib/validation.ts` (`kind` defaulted, swap/add/remove schemas), `src/lib/data/workout-sessions.ts` (kind plumbing + swap/add/remove/avg-duration/catalogue), `src/lib/data/progress.ts` (warm-up exclusion), `src/lib/actions/workout-actions.ts` (swap/add/remove actions, rate-limited `session-write`), `src/components/workout/{set-entry-row,exercise-card,active-workout-logger,workout-draft-state}.tsx/.ts`, `src/app/(app)/sessions/[sessionId]/page.tsx` (loads catalogue), `src/app/(app)/today/page.tsx` (duration). Migration: `drizzle/0003_set_kind.sql`.

The `kind` field in the set-update schema is **defaulted to 'working'**, so offline drafts saved before this deploy still sync without error.

---

# Legacy data — guaranteed preservation

**No change in this patch deletes, drops, retypes, or rewrites existing user data.** Every DB change is additive:

- `0002` — `ALTER TABLE workout_templates ADD COLUMN owner_clerk_user_id text` (nullable) + `CREATE INDEX`. Adds a column; touches no existing row's data.
- `backfill_owner.sql` — an `UPDATE` that only **sets** the new, previously-NULL `owner_clerk_user_id`. It writes nothing else and deletes nothing. Custom routines it can't attribute stay NULL → hidden (not seed, not owned) and remain in the DB, recoverable by setting the owner by hand.
- `0003` — `ALTER TABLE set_entries ADD COLUMN kind text NOT NULL DEFAULT 'working'`. Existing rows auto-fill `'working'`, so all historical sessions, sets, volume, and PRs are byte-for-byte unchanged in meaning.

What is **not** a database operation: deleting `drizzle/0000_initial_schema.sql` removes an unused repo file, not data. The cross-tenant delete fix (#3) only changes *future* behavior — it makes deletes narrower (caller's own sessions), never broader. There are **no** `DROP COLUMN`, `DROP TABLE`, type changes, `NOT NULL` added to existing columns without a default, or row deletions anywhere in the patch.

Offline data (IndexedDB drafts on users' devices) stays compatible: the new `kind` is optional/defaulted in the sync schema.

## Do this to be 100% safe (recommended order)

1. **Back up first.** Either take a **Neon branch** from your production branch (instant copy-on-write snapshot) or `pg_dump "$DATABASE_URL" > backup_$(date +%F).sql`.
2. **Rehearse on the branch.** Point a preview deploy's `DATABASE_URL` at the Neon branch, apply `0002` → `backfill_owner.sql` → `0003` there, and click through the app (sign in, start a workout, view history/progress). Confirm old sessions and PRs still show.
3. **Confirm the target.** `echo "$DATABASE_URL"` (or check the Vercel env) and make sure it's the production branch before applying to prod.
4. **Apply in order** to prod: `0002` → `backfill_owner.sql` → `0003`. Do **not** run `drizzle-kit generate`.
5. **Rollback path:** Neon point-in-time restore / branch reset, or `psql "$DATABASE_URL" < backup_...sql`. Because the changes are additive, a forward fix is usually just `ALTER TABLE ... DROP COLUMN`, but that is not needed for correctness.

---

# Final deployment — step by step

```bash
# 0. Branch + back up
#    Neon console: create a branch from production (or pg_dump as above).

# 1. Remove the orphan migration
git rm drizzle/0000_initial_schema.sql

# 2. Apply the patch over the repo
cp -R patch/. .

# 3. Install new deps (Upstash rate limiter)
npm install

# 4. Typecheck / lint / build / test  (run locally — these were NOT run in my sandbox)
npm run typecheck
npm run lint
npm run build
npm test

# 5. Apply migrations to the DB you backed up, IN ORDER (do NOT run drizzle-kit generate)
psql "$DATABASE_URL" -f drizzle/0002_routine_ownership.sql
psql "$DATABASE_URL" -f drizzle/backfill_owner.sql
psql "$DATABASE_URL" -f drizzle/0003_set_kind.sql

# 6. (Optional) enable rate limiting — no-op until set
#    Vercel project env (or .env.local):
#    UPSTASH_REDIS_REST_URL=...
#    UPSTASH_REDIS_REST_TOKEN=...

# 7. Deploy
git add -A && git commit -m "security hardening + tier 0/1 logging enhancements" && git push
#    (or `vercel --prod`)
```

8. **Post-deploy verification (production):**
   - Open the app with DevTools console open; sign in with **email** and with **Google**. Click through today / workouts / a session / history / progress. Watch for **CSP** violations.
   - If a host is reported (e.g. your Clerk Frontend API `https://clerk.<domain>`), add it to the matching directive in `next.config.ts`. When the console is clean, rename `Content-Security-Policy-Report-Only` → `Content-Security-Policy` and redeploy.
   - **Tenancy smoke test:** as user A grab a routine `dayId`; as user B hit `/workouts/<dayId>`, `/workouts/<dayId>/edit`, and the start/delete/add/remove actions with it — all must be denied. Seed days remain viewable/startable by everyone, never editable.
   - **Feature smoke test:** swap an exercise, log RPE, tap **Use** previous, add and remove a set, mark a warm-up set, watch the rest timer count down/buzz, open the plate calculator, confirm Today shows a duration. Complete a workout and confirm it lands in history and that warm-up sets are excluded from the progress numbers.

> Caveat: this sandbox has no network, so `tsc` / `build` / `npm test` were **not** run here. All files were reviewed by hand against the repo (strict TS, no `noUnusedLocals`). Run step 4 before deploying.
