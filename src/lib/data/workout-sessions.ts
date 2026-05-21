import 'server-only';

import { and, asc, desc, eq, inArray, ne } from 'drizzle-orm';

import { db } from '@/db/client';
import {
  exercises,
  setEntries,
  templateExerciseAssignments,
  workoutExerciseEntries,
  workoutSessions,
  workoutTemplateDays,
} from '@/db/schema';
import { AppError } from '@/lib/errors';
import { assertUserScopedRecord } from '@/lib/security';
import type {
  PreviousPerformance,
  SetDraft,
  SetEntryView,
  TemplateExercise,
  UnitPreference,
  WorkoutExerciseEntryView,
  WorkoutSessionView,
} from '@/lib/types';
import { getTemplateExercisesForDay } from '@/lib/data/workout-templates';

const MAX_HISTORY_SESSIONS = 30;

function createSessionExerciseEntryId(sessionId: string, assignmentId: string): string {
  return `${sessionId}:${assignmentId}`;
}

function createSetEntryId(entryId: string, position: number): string {
  return `${entryId}:set:${position}`;
}

function getTargetLabel(assignment: TemplateExercise, position: number): string {
  const target = assignment.targetReps[position - 1];

  if (typeof target === 'number') {
    return assignment.perSide ? `${target}/side` : `${target}`;
  }

  if (assignment.targetType === 'failure') {
    return 'Failure';
  }

  if (assignment.targetType === 'optional') {
    return 'Optional';
  }

  return '—';
}

function getTargetReps(assignment: TemplateExercise, position: number): number | null {
  const target = assignment.targetReps[position - 1];
  return typeof target === 'number' ? target : null;
}

function resolveSetUnit(assignment: TemplateExercise, userUnit: UnitPreference): UnitPreference | 'none' {
  if (assignment.defaultUnit === 'none' || assignment.measurementType === 'reps_only') {
    return 'none';
  }

  return userUnit;
}

/** Creates or resumes a workout session for a local template day. */
export async function startWorkoutSessionForDay(
  clerkUserId: string,
  dayId: string,
  localDate: string,
  timezone: string,
  unit: UnitPreference,
): Promise<string> {
  const now = new Date();
  const sessionId = crypto.randomUUID();

  const upserted = await db
    .insert(workoutSessions)
    .values({
      id: sessionId,
      clerkUserId,
      templateDayId: dayId,
      localDate,
      timezone,
      status: 'active',
      startedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [workoutSessions.clerkUserId, workoutSessions.templateDayId, workoutSessions.localDate],
      set: {
        updatedAt: now,
      },
    })
    .returning({ id: workoutSessions.id });

  const resolvedSessionId = upserted[0]?.id;

  if (!resolvedSessionId) {
    throw new AppError('mutation_failed', 'Unable to start workout session.');
  }

  await ensureSessionExerciseEntries(resolvedSessionId, dayId, unit);

  return resolvedSessionId;
}

/** Creates missing exercise and set entries for a session from its template day. */
export async function ensureSessionExerciseEntries(
  sessionId: string,
  dayId: string,
  unit: UnitPreference,
): Promise<void> {
  const assignments = await getTemplateExercisesForDay(dayId);

  for (const assignment of assignments) {
    const entryId = createSessionExerciseEntryId(sessionId, assignment.assignmentId);

    await db
      .insert(workoutExerciseEntries)
      .values({
        id: entryId,
        sessionId,
        assignmentId: assignment.assignmentId,
        exerciseId: assignment.exerciseId,
        selectedExerciseId: assignment.exerciseId,
        position: assignment.position,
      })
      .onConflictDoNothing();

    for (let position = 1; position <= assignment.sets; position += 1) {
      await db
        .insert(setEntries)
        .values({
          id: createSetEntryId(entryId, position),
          workoutExerciseEntryId: entryId,
          position,
          targetReps: getTargetReps(assignment, position),
          targetLabel: getTargetLabel(assignment, position),
          unit: resolveSetUnit(assignment, unit),
        })
        .onConflictDoNothing();
    }
  }
}

/** Returns a fully hydrated workout session owned by the authenticated user. */
export async function getWorkoutSessionView(
  clerkUserId: string,
  sessionId: string,
): Promise<WorkoutSessionView> {
  const sessionRows = await db
    .select({
      id: workoutSessions.id,
      clerkUserId: workoutSessions.clerkUserId,
      localDate: workoutSessions.localDate,
      timezone: workoutSessions.timezone,
      status: workoutSessions.status,
      startedAt: workoutSessions.startedAt, // <--- ADDED FETCHING STARTED_AT HERE
      notes: workoutSessions.notes,
      dayId: workoutTemplateDays.id,
      dayName: workoutTemplateDays.name,
      muscleGroup: workoutTemplateDays.muscleGroup,
      isRestDay: workoutTemplateDays.isRestDay,
      isOptional: workoutTemplateDays.isOptional,
    })
    .from(workoutSessions)
    .innerJoin(workoutTemplateDays, eq(workoutTemplateDays.id, workoutSessions.templateDayId))
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.clerkUserId, clerkUserId)))
    .limit(1);

  const session = sessionRows[0];

  if (!session) {
    throw new AppError('not_found', 'Workout session was not found.');
  }

  assertUserScopedRecord(session, clerkUserId);

  const entryRows = await db
    .select({
      id: workoutExerciseEntries.id,
      assignmentId: workoutExerciseEntries.assignmentId,
      exerciseId: workoutExerciseEntries.exerciseId,
      selectedExerciseId: workoutExerciseEntries.selectedExerciseId,
      position: workoutExerciseEntries.position,
      notes: workoutExerciseEntries.notes,
      displayName: templateExerciseAssignments.displayName,
      targetNote: templateExerciseAssignments.targetNote,
      perSide: templateExerciseAssignments.perSide,
      measurementType: exercises.measurementType,
      defaultUnit: exercises.defaultUnit,
    })
    .from(workoutExerciseEntries)
    .innerJoin(templateExerciseAssignments, eq(templateExerciseAssignments.id, workoutExerciseEntries.assignmentId))
    .innerJoin(exercises, eq(exercises.id, workoutExerciseEntries.selectedExerciseId))
    .where(eq(workoutExerciseEntries.sessionId, session.id))
    .orderBy(asc(workoutExerciseEntries.position));

  const entryIds = entryRows.map((entry) => entry.id);
  const setRows = entryIds.length
    ? await db
        .select({
          id: setEntries.id,
          workoutExerciseEntryId: setEntries.workoutExerciseEntryId,
          position: setEntries.position,
          targetReps: setEntries.targetReps,
          targetLabel: setEntries.targetLabel,
          weight: setEntries.weight,
          reps: setEntries.reps,
          unit: setEntries.unit,
          rpe: setEntries.rpe,
          completed: setEntries.completed,
          completedAt: setEntries.completedAt, // Needed for internal timers
        })
        .from(setEntries)
        .where(inArray(setEntries.workoutExerciseEntryId, entryIds))
        .orderBy(asc(setEntries.position))
    : [];

  const previousPerformance = await getPreviousPerformances(
    clerkUserId,
    entryRows.map((entry) => entry.selectedExerciseId),
    session.id,
  );

  const setsByEntryId = new Map<string, SetEntryView[]>();

  for (const row of setRows) {
    const existing = setsByEntryId.get(row.workoutExerciseEntryId) ?? [];
    existing.push({
      id: row.id,
      position: row.position,
      targetReps: row.targetReps,
      targetLabel: row.targetLabel,
      weight: row.weight,
      reps: row.reps,
      unit: row.unit as UnitPreference | 'none',
      rpe: row.rpe,
      completed: row.completed,
      completedAt: row.completedAt, // Needed for internal timers
    } as any);
    setsByEntryId.set(row.workoutExerciseEntryId, existing);
  }

  const exercisesForView: WorkoutExerciseEntryView[] = entryRows.map((entry) => ({
    id: entry.id,
    assignmentId: entry.assignmentId,
    exerciseId: entry.exerciseId,
    selectedExerciseId: entry.selectedExerciseId,
    displayName: entry.displayName,
    position: entry.position,
    targetNote: entry.targetNote,
    measurementType: entry.measurementType,
    defaultUnit: entry.defaultUnit as UnitPreference | 'none',
    perSide: entry.perSide,
    notes: entry.notes,
    previousPerformance: previousPerformance.get(entry.selectedExerciseId) ?? null,
    sets: setsByEntryId.get(entry.id) ?? [],
  }));

  return {
    id: session.id,
    localDate: session.localDate,
    timezone: session.timezone,
    status: session.status as WorkoutSessionView['status'],
    startedAt: session.startedAt, // <--- ADDED RETURN DATA HERE
    notes: session.notes,
    day: {
      id: session.dayId,
      name: session.dayName,
      muscleGroup: session.muscleGroup,
      isRestDay: session.isRestDay,
      isOptional: session.isOptional,
    },
    exercises: exercisesForView,
  };
}

/** Updates a set entry after proving ownership through the parent session. */
export async function updateSetEntryForUser(clerkUserId: string, draft: SetDraft): Promise<void> {
  const ownership = await db
    .select({
      setId: setEntries.id,
      clerkUserId: workoutSessions.clerkUserId,
    })
    .from(setEntries)
    .innerJoin(workoutExerciseEntries, eq(workoutExerciseEntries.id, setEntries.workoutExerciseEntryId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .where(and(eq(setEntries.id, draft.setEntryId), eq(workoutSessions.clerkUserId, clerkUserId)))
    .limit(1);

  const row = ownership[0];

  if (!row) {
    throw new AppError('not_found', 'Set entry was not found.');
  }

  assertUserScopedRecord(row, clerkUserId);

  await db
    .update(setEntries)
    .set({
      weight: draft.weight,
      reps: draft.reps,
      rpe: draft.rpe,
      completed: draft.completed,
      // Uses the draft's exact client time so the rest timer is accurate
      completedAt: draft.completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(setEntries.id, draft.setEntryId));
}

/** Updates exercise notes after proving ownership through the parent session. */
export async function updateExerciseNotesForUser(
  clerkUserId: string,
  exerciseEntryId: string,
  notes: string,
): Promise<void> {
  const ownership = await db
    .select({
      exerciseEntryId: workoutExerciseEntries.id,
      clerkUserId: workoutSessions.clerkUserId,
    })
    .from(workoutExerciseEntries)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .where(and(eq(workoutExerciseEntries.id, exerciseEntryId), eq(workoutSessions.clerkUserId, clerkUserId)))
    .limit(1);

  const row = ownership[0];

  if (!row) {
    throw new AppError('not_found', 'Exercise entry was not found.');
  }

  assertUserScopedRecord(row, clerkUserId);

  await db
    .update(workoutExerciseEntries)
    .set({ notes, updatedAt: new Date() })
    .where(eq(workoutExerciseEntries.id, exerciseEntryId));
}

/** Updates session notes after proving session ownership. */
export async function updateSessionNotesForUser(
  clerkUserId: string,
  sessionId: string,
  notes: string,
): Promise<void> {
  const row = await getOwnedSessionRow(clerkUserId, sessionId);
  assertUserScopedRecord(row, clerkUserId);

  await db
    .update(workoutSessions)
    .set({ notes, updatedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId));
}

/** Marks a workout session complete without locking future safe edits. */
export async function completeWorkoutSessionForUser(clerkUserId: string, sessionId: string): Promise<void> {
  const row = await getOwnedSessionRow(clerkUserId, sessionId);
  assertUserScopedRecord(row, clerkUserId);

  await db
    .update(workoutSessions)
    .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId));
}

/** Applies a locally persisted workout draft to the server after connectivity returns. */
export async function syncWorkoutDraftForUser(
  clerkUserId: string,
  sessionId: string,
  sessionNotes: string,
  exerciseNotes: Record<string, string>,
  sets: SetDraft[],
): Promise<void> {
  const row = await getOwnedSessionRow(clerkUserId, sessionId);
  assertUserScopedRecord(row, clerkUserId);

  await updateSessionNotesForUser(clerkUserId, sessionId, sessionNotes);

  for (const [exerciseEntryId, notes] of Object.entries(exerciseNotes)) {
    await updateExerciseNotesForUser(clerkUserId, exerciseEntryId, notes);
  }

  for (const set of sets) {
    await updateSetEntryForUser(clerkUserId, set);
  }
}

/** Returns an existing session for a user/day/local date when one has already been started. */
export async function getSessionForDayOnDate(
  clerkUserId: string,
  dayId: string,
  localDate: string,
): Promise<{ id: string; status: string } | null> {
  const rows = await db
    .select({ id: workoutSessions.id, status: workoutSessions.status })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.clerkUserId, clerkUserId),
        eq(workoutSessions.templateDayId, dayId),
        eq(workoutSessions.localDate, localDate),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

/** Returns recent sessions for the authenticated user. */
export async function getRecentWorkoutSessions(clerkUserId: string): Promise<
  {
    id: string;
    localDate: string;
    status: string;
    notes: string;
    dayName: string;
    muscleGroup: string;
  }[]
> {
  return db
    .select({
      id: workoutSessions.id,
      localDate: workoutSessions.localDate,
      status: workoutSessions.status,
      notes: workoutSessions.notes,
      dayName: workoutTemplateDays.name,
      muscleGroup: workoutTemplateDays.muscleGroup,
    })
    .from(workoutSessions)
    .innerJoin(workoutTemplateDays, eq(workoutTemplateDays.id, workoutSessions.templateDayId))
    .where(eq(workoutSessions.clerkUserId, clerkUserId))
    .orderBy(desc(workoutSessions.localDate))
    .limit(MAX_HISTORY_SESSIONS);
}

/** Returns set-level history for a single exercise owned by the authenticated user. */
export async function getExerciseHistoryForUser(clerkUserId: string, exerciseId: string): Promise<
  {
    sessionId: string;
    localDate: string;
    weight: number | null;
    reps: number | null;
    unit: UnitPreference | 'none';
    completed: boolean;
  }[]
> {
  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      localDate: workoutSessions.localDate,
      weight: setEntries.weight,
      reps: setEntries.reps,
      unit: setEntries.unit,
      completed: setEntries.completed,
    })
    .from(setEntries)
    .innerJoin(workoutExerciseEntries, eq(workoutExerciseEntries.id, setEntries.workoutExerciseEntryId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .where(
      and(
        eq(workoutSessions.clerkUserId, clerkUserId),
        eq(workoutExerciseEntries.selectedExerciseId, exerciseId),
      ),
    )
    .orderBy(desc(workoutSessions.localDate), asc(setEntries.position))
    .limit(200);

  return rows.map((row) => ({
    ...row,
    unit: row.unit as UnitPreference | 'none',
  }));
}

/** Lists exercises that have logged entries for the authenticated user. */
export async function getLoggedExercisesForUser(clerkUserId: string): Promise<{ id: string; name: string }[]> {
  const rows = await db
    .select({
      id: workoutExerciseEntries.selectedExerciseId,
      name: exercises.name,
    })
    .from(workoutExerciseEntries)
    .innerJoin(exercises, eq(exercises.id, workoutExerciseEntries.selectedExerciseId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .where(eq(workoutSessions.clerkUserId, clerkUserId))
    .orderBy(asc(exercises.name));

  const unique = new Map<string, string>();

  for (const row of rows) {
    unique.set(row.id, row.name);
  }

  return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
}

async function getOwnedSessionRow(
  clerkUserId: string,
  sessionId: string,
): Promise<{ id: string; clerkUserId: string }> {
  const rows = await db
    .select({ id: workoutSessions.id, clerkUserId: workoutSessions.clerkUserId })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.clerkUserId, clerkUserId)))
    .limit(1);

  const row = rows[0];

  if (!row) {
    throw new AppError('not_found', 'Workout session was not found.');
  }

  return row;
}

async function getPreviousPerformances(
  clerkUserId: string,
  exerciseIds: string[],
  currentSessionId: string,
): Promise<Map<string, PreviousPerformance>> {
  if (exerciseIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      exerciseId: workoutExerciseEntries.selectedExerciseId,
      localDate: workoutSessions.localDate,
      weight: setEntries.weight,
      reps: setEntries.reps,
      unit: setEntries.unit,
      completedAt: workoutSessions.completedAt,
    })
    .from(setEntries)
    .innerJoin(workoutExerciseEntries, eq(workoutExerciseEntries.id, setEntries.workoutExerciseEntryId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .where(
      and(
        eq(workoutSessions.clerkUserId, clerkUserId),
        eq(workoutSessions.status, 'completed'),
        ne(workoutSessions.id, currentSessionId),
        eq(setEntries.completed, true),
        inArray(workoutExerciseEntries.selectedExerciseId, exerciseIds),
      ),
    )
    .orderBy(desc(workoutSessions.completedAt), desc(setEntries.weight));

  const previous = new Map<string, PreviousPerformance>();

  for (const row of rows) {
    if (previous.has(row.exerciseId) || row.weight === null || row.reps === null) {
      continue;
    }

    previous.set(row.exerciseId, {
      weight: row.weight,
      reps: row.reps,
      unit: row.unit as UnitPreference | 'none',
      localDate: row.localDate,
    });
  }

  return previous;
} 