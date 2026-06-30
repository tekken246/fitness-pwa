import 'server-only';

import { and, asc, eq, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, templateExerciseAssignments, workoutTemplateDays, workoutTemplates } from '@/db/schema';
import { AppError } from '@/lib/errors';
import type { TemplateExercise, WorkoutDaySummary } from '@/lib/types';
import { getUsableTemplateDay } from '@/lib/data/routine-access';

/** Shared loader: day summaries (with exercise names) for a template-scope filter. */
async function loadDaySummaries(where: SQL | undefined): Promise<WorkoutDaySummary[]> {
  const rows = await db
    .select({
      dayId: workoutTemplateDays.id,
      dayOfWeek: workoutTemplateDays.dayOfWeek,
      displayOrder: workoutTemplateDays.displayOrder,
      name: workoutTemplateDays.name,
      muscleGroup: workoutTemplateDays.muscleGroup,
      isRestDay: workoutTemplateDays.isRestDay,
      isOptional: workoutTemplateDays.isOptional,
      exerciseName: templateExerciseAssignments.displayName,
      exercisePosition: templateExerciseAssignments.position,
    })
    .from(workoutTemplateDays)
    .innerJoin(workoutTemplates, eq(workoutTemplates.id, workoutTemplateDays.templateId))
    .leftJoin(templateExerciseAssignments, eq(templateExerciseAssignments.dayId, workoutTemplateDays.id))
    .where(where)
    .orderBy(asc(workoutTemplateDays.displayOrder), asc(templateExerciseAssignments.position));

  const dayMap = new Map<string, WorkoutDaySummary>();

  for (const row of rows) {
    const existing = dayMap.get(row.dayId);
    const day =
      existing ??
      {
        id: row.dayId,
        dayOfWeek: row.dayOfWeek,
        displayOrder: row.displayOrder,
        name: row.name,
        muscleGroup: row.muscleGroup,
        isRestDay: row.isRestDay,
        isOptional: row.isOptional,
        exercises: [] as string[],
      };

    if (row.exerciseName) {
      day.exercises.push(row.exerciseName);
    }

    dayMap.set(row.dayId, day);
  }

  return Array.from(dayMap.values()).sort((left, right) => left.displayOrder - right.displayOrder);
}

/** Returns the shared, read-only seed weekly plan (Monday-Sunday). */
export async function getSeedWeeklyPlan(): Promise<WorkoutDaySummary[]> {
  return loadDaySummaries(eq(workoutTemplates.isSeed, true));
}

/** Returns routines owned by the authenticated user (never the seed, never other users'). */
export async function getRoutinesForUser(clerkUserId: string): Promise<WorkoutDaySummary[]> {
  return loadDaySummaries(
    and(eq(workoutTemplates.ownerClerkUserId, clerkUserId), eq(workoutTemplates.isSeed, false)),
  );
}

/** Returns the seeded template day for a local ISO weekday. */
export async function getTemplateDayByIsoWeekday(dayOfWeek: number): Promise<WorkoutDaySummary> {
  const plan = await getSeedWeeklyPlan();
  const day = plan.find((item) => item.dayOfWeek === dayOfWeek);

  if (!day) {
    throw new AppError('not_found', 'Workout day was not found.');
  }

  return day;
}

/** Returns a template day and its assignments, only if the user may view it (seed or owned). */
export async function getTemplateDayDetail(
  dayId: string,
  clerkUserId: string,
): Promise<{ day: WorkoutDaySummary; exercises: TemplateExercise[] }> {
  // Authorise first: shared seed, or a routine owned by this user.
  await getUsableTemplateDay(dayId, clerkUserId);

  const [day] = await loadDaySummaries(eq(workoutTemplateDays.id, dayId));

  if (!day) {
    throw new AppError('not_found', 'Workout day was not found.');
  }

  return {
    day,
    exercises: await getTemplateExercisesForDay(dayId),
  };
}

/** Returns exercise assignments for a template day. Callers MUST authorise the day first. */
export async function getTemplateExercisesForDay(dayId: string): Promise<TemplateExercise[]> {
  const rows = await db
    .select({
      assignmentId: templateExerciseAssignments.id,
      exerciseId: templateExerciseAssignments.exerciseId,
      alternativeExerciseId: templateExerciseAssignments.alternativeExerciseId,
      displayName: templateExerciseAssignments.displayName,
      position: templateExerciseAssignments.position,
      targetReps: templateExerciseAssignments.targetReps,
      sets: templateExerciseAssignments.sets,
      targetType: templateExerciseAssignments.targetType,
      targetNote: templateExerciseAssignments.targetNote,
      measurementType: exercises.measurementType,
      defaultUnit: exercises.defaultUnit,
      perSide: templateExerciseAssignments.perSide,
      isOptional: templateExerciseAssignments.isOptional,
      exerciseName: exercises.name,
    })
    .from(templateExerciseAssignments)
    .innerJoin(exercises, eq(exercises.id, templateExerciseAssignments.exerciseId))
    .where(eq(templateExerciseAssignments.dayId, dayId))
    .orderBy(asc(templateExerciseAssignments.position));

  return rows.map((row) => ({
    assignmentId: row.assignmentId,
    exerciseId: row.exerciseId,
    alternativeExerciseId: row.alternativeExerciseId,
    displayName: row.displayName,
    position: row.position,
    targetReps: row.targetReps,
    sets: row.sets,
    targetType: row.targetType,
    targetNote: row.targetNote,
    measurementType: row.measurementType,
    defaultUnit: row.defaultUnit as TemplateExercise['defaultUnit'],
    perSide: row.perSide,
    isOptional: row.isOptional,
  }));
}
