import 'server-only';

import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, setEntries, workoutExerciseEntries, workoutSessions } from '@/db/schema';
import {
  calculateBestEstimatedOneRepMax,
  calculateBestSetWeight,
  calculateVolume,
  compareProgress,
  detectPersonalRecord,
} from '@/lib/progress';
import type { ExerciseProgressPoint, ExerciseProgressSummary } from '@/lib/types';

type ProgressRow = {
  sessionId: string;
  localDate: string;
  exerciseId: string;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
};

type ExerciseSessionGroup = {
  sessionId: string;
  localDate: string;
  exerciseId: string;
  exerciseName: string;
  sets: { weight: number | null; reps: number | null }[];
};

/** Returns progress summaries for exercises logged by the authenticated user. */
export async function getProgressSummariesForUser(clerkUserId: string): Promise<ExerciseProgressSummary[]> {
  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      localDate: workoutSessions.localDate,
      exerciseId: workoutExerciseEntries.selectedExerciseId,
      exerciseName: exercises.name,
      weight: setEntries.weight,
      reps: setEntries.reps,
    })
    .from(setEntries)
    .innerJoin(workoutExerciseEntries, eq(workoutExerciseEntries.id, setEntries.workoutExerciseEntryId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .innerJoin(exercises, eq(exercises.id, workoutExerciseEntries.selectedExerciseId))
    .where(
      and(
        eq(workoutSessions.clerkUserId, clerkUserId),
        eq(workoutSessions.status, 'completed'),
        eq(setEntries.completed, true),
      ),
    )
    .orderBy(asc(workoutSessions.localDate), asc(setEntries.position));

  return buildProgressSummaries(rows);
}

/** Returns progress summary for one exercise owned by the authenticated user. */
export async function getExerciseProgressForUser(
  clerkUserId: string,
  exerciseId: string,
): Promise<ExerciseProgressSummary | null> {
  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      localDate: workoutSessions.localDate,
      exerciseId: workoutExerciseEntries.selectedExerciseId,
      exerciseName: exercises.name,
      weight: setEntries.weight,
      reps: setEntries.reps,
    })
    .from(setEntries)
    .innerJoin(workoutExerciseEntries, eq(workoutExerciseEntries.id, setEntries.workoutExerciseEntryId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .innerJoin(exercises, eq(exercises.id, workoutExerciseEntries.selectedExerciseId))
    .where(
      and(
        eq(workoutSessions.clerkUserId, clerkUserId),
        eq(workoutExerciseEntries.selectedExerciseId, exerciseId),
        eq(workoutSessions.status, 'completed'),
        eq(setEntries.completed, true),
      ),
    )
    .orderBy(asc(workoutSessions.localDate), asc(setEntries.position));

  return buildProgressSummaries(rows)[0] ?? null;
}

/** Builds per-exercise progress summaries from completed set rows. */
export function buildProgressSummaries(rows: ProgressRow[]): ExerciseProgressSummary[] {
  const sessionGroups = new Map<string, ExerciseSessionGroup>();

  for (const row of rows) {
    const key = `${row.exerciseId}:${row.sessionId}`;
    const existing = sessionGroups.get(key);
    const group =
      existing ??
      {
        sessionId: row.sessionId,
        localDate: row.localDate,
        exerciseId: row.exerciseId,
        exerciseName: row.exerciseName,
        sets: [],
      };

    group.sets.push({ weight: row.weight, reps: row.reps });
    sessionGroups.set(key, group);
  }

  const pointsByExercise = new Map<string, { name: string; points: ExerciseProgressPoint[] }>();

  for (const group of sessionGroups.values()) {
    const point: ExerciseProgressPoint = {
      localDate: group.localDate,
      volume: calculateVolume(group.sets),
      bestWeight: calculateBestSetWeight(group.sets),
      estimatedOneRepMax: calculateBestEstimatedOneRepMax(group.sets),
      totalReps: group.sets.reduce((total, set) => total + (set.reps ?? 0), 0),
    };

    const existing = pointsByExercise.get(group.exerciseId) ?? { name: group.exerciseName, points: [] };
    existing.points.push(point);
    pointsByExercise.set(group.exerciseId, existing);
  }

  return Array.from(pointsByExercise.entries())
    .map(([exerciseId, value]) => {
      const points = value.points.sort((left, right) => left.localDate.localeCompare(right.localDate));
      const latest = points.at(-1) ?? null;
      const previous = points.at(-2) ?? null;

      return {
        exerciseId,
        exerciseName: value.name,
        latest,
        previous,
        trend: compareProgress(latest, previous),
        personalRecord: detectPersonalRecord(points),
        points,
      };
    })
    .sort((left, right) => left.exerciseName.localeCompare(right.exerciseName));
}
