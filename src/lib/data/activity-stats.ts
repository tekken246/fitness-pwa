import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { setEntries, workoutExerciseEntries, workoutSessions } from '@/db/schema';
import { getSeedWeeklyPlan } from '@/lib/data/workout-templates';
import { getIsoWeekdayForTimezone, getLocalDateForTimezone } from '@/lib/timezone';

// ---------------------------------------------------------------------------
// Calendar helpers (pure, timezone-safe: operate on YYYY-MM-DD strings)
// ---------------------------------------------------------------------------

/** Adds (or subtracts) whole calendar days to a YYYY-MM-DD string. */
function addDaysToIsoDate(iso: string, delta: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

type WeekRanges = {
  today: string;
  isoWeekday: number; // 1 = Mon … 7 = Sun
  startThisWeek: string;
  startLastWeek: string;
  lastWeekSamePeriodEnd: string; // last week up to the same weekday as today
};

function resolveWeekRanges(now: Date, timezone: string): WeekRanges {
  const today = getLocalDateForTimezone(now, timezone);
  const isoWeekday = getIsoWeekdayForTimezone(now, timezone);
  const startThisWeek = addDaysToIsoDate(today, -(isoWeekday - 1));
  const startLastWeek = addDaysToIsoDate(startThisWeek, -7);
  const lastWeekSamePeriodEnd = addDaysToIsoDate(startLastWeek, isoWeekday - 1);
  return { today, isoWeekday, startThisWeek, startLastWeek, lastWeekSamePeriodEnd };
}

/** Sums completed working-set volume for a user across an inclusive local-date range. */
async function sumWorkingVolumeInRange(clerkUserId: string, startDate: string, endDate: string): Promise<number> {
  const rows = await db
    .select({
      volume: sql<number>`coalesce(sum(${setEntries.weight} * ${setEntries.reps}), 0)`,
    })
    .from(setEntries)
    .innerJoin(workoutExerciseEntries, eq(workoutExerciseEntries.id, setEntries.workoutExerciseEntryId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .where(
      and(
        eq(workoutSessions.clerkUserId, clerkUserId),
        eq(setEntries.completed, true),
        eq(setEntries.kind, 'working'),
        gte(workoutSessions.localDate, startDate),
        lte(workoutSessions.localDate, endDate),
      ),
    );

  return Number(rows[0]?.volume ?? 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Consecutive-day streak of completed sessions, ending today or yesterday.
 * (An unfinished today does not break yesterday's streak.)
 */
export async function getWorkoutStreak(clerkUserId: string, timezone: string, now: Date): Promise<number> {
  const today = getLocalDateForTimezone(now, timezone);

  const rows = await db
    .selectDistinct({ localDate: workoutSessions.localDate })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.clerkUserId, clerkUserId), eq(workoutSessions.status, 'completed')))
    .orderBy(desc(workoutSessions.localDate));

  const dates = new Set(rows.map((row) => row.localDate));
  if (dates.size === 0) return 0;

  let cursor = today;
  if (!dates.has(cursor)) {
    cursor = addDaysToIsoDate(today, -1);
    if (!dates.has(cursor)) return 0;
  }

  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDaysToIsoDate(cursor, -1);
  }
  return streak;
}

export type WeeklyGoalProgress = {
  count: number;
  goal: number;
};

/** Completed workouts in the current ISO week vs the seed plan's training-day count. */
export async function getWeeklyGoalProgress(clerkUserId: string, timezone: string, now: Date): Promise<WeeklyGoalProgress> {
  const { today, startThisWeek } = resolveWeekRanges(now, timezone);

  const [sessionRows, seedPlan] = await Promise.all([
    db
      .selectDistinct({ localDate: workoutSessions.localDate })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.clerkUserId, clerkUserId),
          eq(workoutSessions.status, 'completed'),
          gte(workoutSessions.localDate, startThisWeek),
          lte(workoutSessions.localDate, today),
        ),
      ),
    getSeedWeeklyPlan(),
  ]);

  const trainingDays = seedPlan.filter((day) => day.exercises.length > 0).length;
  return { count: sessionRows.length, goal: Math.max(1, trainingDays) };
}

export type VolumeMomentum = {
  thisWeek: number;
  lastWeek: number;
  deltaPct: number | null; // null when there is no comparable prior volume
};

/** This-week-so-far working volume vs the same period last week. */
export async function getVolumeMomentum(clerkUserId: string, timezone: string, now: Date): Promise<VolumeMomentum> {
  const { today, startThisWeek, startLastWeek, lastWeekSamePeriodEnd } = resolveWeekRanges(now, timezone);

  const [thisWeek, lastWeek] = await Promise.all([
    sumWorkingVolumeInRange(clerkUserId, startThisWeek, today),
    sumWorkingVolumeInRange(clerkUserId, startLastWeek, lastWeekSamePeriodEnd),
  ]);

  const deltaPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
  return { thisWeek, lastWeek, deltaPct };
}

export type SessionMetrics = {
  volume: number;
  sets: number;
  durationSeconds: number | null; // null while the session is still active
};

/** Per-session volume, completed working-set count, and duration for the given session ids. */
export async function getSessionMetricsMap(sessionIds: string[]): Promise<Map<string, SessionMetrics>> {
  const map = new Map<string, SessionMetrics>();
  if (sessionIds.length === 0) return map;

  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      volume: sql<number>`coalesce(sum(case when ${setEntries.completed} and ${setEntries.kind} = 'working' then ${setEntries.weight} * ${setEntries.reps} else 0 end), 0)`,
      sets: sql<number>`count(case when ${setEntries.completed} and ${setEntries.kind} = 'working' then 1 end)`,
      startedAt: workoutSessions.startedAt,
      completedAt: workoutSessions.completedAt,
    })
    .from(workoutSessions)
    .leftJoin(workoutExerciseEntries, eq(workoutExerciseEntries.sessionId, workoutSessions.id))
    .leftJoin(setEntries, eq(setEntries.workoutExerciseEntryId, workoutExerciseEntries.id))
    .where(inArray(workoutSessions.id, sessionIds))
    .groupBy(workoutSessions.id, workoutSessions.startedAt, workoutSessions.completedAt);

  for (const row of rows) {
    const durationSeconds =
      row.completedAt && row.startedAt
        ? Math.max(0, Math.round((new Date(row.completedAt).getTime() - new Date(row.startedAt).getTime()) / 1000))
        : null;
    map.set(row.sessionId, { volume: Number(row.volume ?? 0), sets: Number(row.sets ?? 0), durationSeconds });
  }

  return map;
}

export type HistoryHeadlineStats = {
  totalWorkouts: number;
  monthVolume: number;
};

/** Totals for the History header strip: completed-session count and current-month working volume. */
export async function getHistoryHeadlineStats(clerkUserId: string, timezone: string, now: Date): Promise<HistoryHeadlineStats> {
  const today = getLocalDateForTimezone(now, timezone);
  const startOfMonth = `${today.slice(0, 8)}01`;

  const [countRows, monthVolume] = await Promise.all([
    db
      .select({ total: sql<number>`count(${workoutSessions.id})` })
      .from(workoutSessions)
      .where(and(eq(workoutSessions.clerkUserId, clerkUserId), eq(workoutSessions.status, 'completed'))),
    sumWorkingVolumeInRange(clerkUserId, startOfMonth, today),
  ]);

  return { totalWorkouts: Number(countRows[0]?.total ?? 0), monthVolume };
}
