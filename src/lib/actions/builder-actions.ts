'use server';

import { and, eq, inArray, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { db } from '@/db/client';
import { exercises, templateExerciseAssignments } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';
import { assertEditableTemplateDay } from '@/lib/data/routine-access';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function addExerciseToRoutineAction(formData: FormData) {
  const clerkUserId = await requireClerkUserId();
  await enforceRateLimit(clerkUserId, 'routine-write');

  const dayId = formData.get('dayId') as string | null;
  const exerciseId = formData.get('exerciseId') as string | null;

  if (!dayId || !exerciseId) throw new Error('Missing required fields');

  // Authorise: only the owner of this (non-seed) routine may modify it.
  await assertEditableTemplateDay(dayId, clerkUserId);

  // The exercise catalogue is intentionally global/shared.
  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
  if (!exercise) throw new Error('Exercise not found');

  const [result] = await db
    .select({ maxPosition: max(templateExerciseAssignments.position) })
    .from(templateExerciseAssignments)
    .where(eq(templateExerciseAssignments.dayId, dayId));

  const nextPosition = (result?.maxPosition ?? -1) + 1;

  await db.insert(templateExerciseAssignments).values({
    id: `assign_${crypto.randomUUID()}`,
    dayId,
    exerciseId,
    displayName: exercise.name,
    position: nextPosition,
    sets: 3,
    targetReps: [10, 10, 10],
    targetType: 'weight_reps',
    isOptional: false,
    perSide: false,
  });

  revalidatePath(`/workouts/${dayId}/edit`);
}

export async function removeExerciseFromRoutineAction(formData: FormData) {
  const clerkUserId = await requireClerkUserId();
  await enforceRateLimit(clerkUserId, 'routine-write');

  const assignmentId = formData.get('assignmentId') as string | null;
  const dayId = formData.get('dayId') as string | null;

  if (!assignmentId || !dayId) throw new Error('Missing assignment id');

  // Authorise the parent routine, then constrain the delete to that day so a mismatched
  // dayId cannot remove an assignment from a routine the user does not own.
  await assertEditableTemplateDay(dayId, clerkUserId);

  await db
    .delete(templateExerciseAssignments)
    .where(and(eq(templateExerciseAssignments.id, assignmentId), eq(templateExerciseAssignments.dayId, dayId)));

  revalidatePath(`/workouts/${dayId}/edit`);
}

export async function addExercisesToRoutineAction({
  dayId,
  exerciseIds,
}: {
  dayId: string;
  exerciseIds: string[];
}): Promise<void> {
  const clerkUserId = await requireClerkUserId();
  await enforceRateLimit(clerkUserId, 'routine-write');

  if (!dayId) throw new Error('Missing routine id');

  const uniqueIds = Array.from(new Set(exerciseIds)).filter(Boolean);
  if (uniqueIds.length === 0) return;
  if (uniqueIds.length > 50) throw new Error('Too many exercises selected at once (max 50).');

  // Authorise: only the owner of this (non-seed) routine may modify it.
  await assertEditableTemplateDay(dayId, clerkUserId);

  // Validate every id against the shared catalogue; drop anything unknown.
  const rows = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(inArray(exercises.id, uniqueIds));
  const nameById = new Map(rows.map((row) => [row.id, row.name]));

  const [result] = await db
    .select({ maxPosition: max(templateExerciseAssignments.position) })
    .from(templateExerciseAssignments)
    .where(eq(templateExerciseAssignments.dayId, dayId));

  let nextPosition = (result?.maxPosition ?? -1) + 1;

  // Preserve the order the athlete selected them in, and keep positions sequential
  // so the (dayId, position) unique index never collides.
  const values = uniqueIds
    .filter((id) => nameById.has(id))
    .map((id) => ({
      id: `assign_${crypto.randomUUID()}`,
      dayId,
      exerciseId: id,
      displayName: nameById.get(id) as string,
      position: nextPosition++,
      sets: 3,
      targetReps: [10, 10, 10],
      targetType: 'weight_reps',
      isOptional: false,
      perSide: false,
    }));

  if (values.length === 0) return;

  await db.insert(templateExerciseAssignments).values(values);

  revalidatePath(`/workouts/${dayId}/edit`);
}
