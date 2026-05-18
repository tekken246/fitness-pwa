import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, templateExerciseAssignments, workoutTemplateDays } from '@/db/schema';
import { AppError } from '@/lib/errors';
import type { TemplateExercise, WorkoutDaySummary } from '@/lib/types';
import { SEED_TEMPLATE_ID } from '@/lib/workouts/seed-plan';

/** Returns the seeded weekly workout plan with exercise names grouped by day. */
export async function getWeeklyPlan(): Promise<WorkoutDaySummary[]> {
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
    .leftJoin(templateExerciseAssignments, eq(templateExerciseAssignments.dayId, workoutTemplateDays.id))
    // .where(eq(workoutTemplateDays.templateId, SEED_TEMPLATE_ID))
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

/** Returns the seeded template day for a local ISO weekday. */
export async function getTemplateDayByIsoWeekday(dayOfWeek: number): Promise<WorkoutDaySummary> {
  const plan = await getWeeklyPlan();
  const day = plan.find((item) => item.dayOfWeek === dayOfWeek);

  if (!day) {
    throw new AppError('not_found', 'Workout day was not found.');
  }

  return day;
}

/** Returns the seeded template day and exercise assignments by day ID. */
export async function getTemplateDayDetail(dayId: string): Promise<{
  day: WorkoutDaySummary;
  exercises: TemplateExercise[];
}> {
  const plan = await getWeeklyPlan();
  const day = plan.find((item) => item.id === dayId);

  if (!day) {
    throw new AppError('not_found', 'Workout day was not found.');
  }

  return {
    day,
    exercises: await getTemplateExercisesForDay(dayId),
  };
}

/** Returns exercise assignments for a seeded template day. */
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
