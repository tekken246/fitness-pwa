'use server';

import { eq, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db/client';
import { exercises, templateExerciseAssignments } from '@/db/schema';
import { requireUser } from '@/lib/auth';

export async function addExerciseToRoutineAction(formData: FormData) {
  await requireUser(); // Ensure authentication
  
  const dayId = formData.get('dayId') as string;
  const exerciseId = formData.get('exerciseId') as string;

  if (!dayId || !exerciseId) throw new Error('Missing required fields');

  // Fetch the exercise to use its name as the default displayName
  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId));
  if (!exercise) throw new Error('Exercise not found');

  // Calculate the next position at the bottom of the list
  const [result] = await db
    .select({ maxPosition: max(templateExerciseAssignments.position) })
    .from(templateExerciseAssignments)
    .where(eq(templateExerciseAssignments.dayId, dayId));
  
  const nextPosition = (result?.maxPosition ?? -1) + 1;

  // Insert the new exercise assignment
  await db.insert(templateExerciseAssignments).values({
    id: `assign_${crypto.randomUUID()}`,
    dayId: dayId,
    exerciseId: exerciseId,
    displayName: exercise.name,
    position: nextPosition,
    sets: 3, // Default to 3 sets
    targetReps: [10, 10, 10], // Default hypertrophy rep range
    targetType: 'weight_reps',
    isOptional: false,
    perSide: false,
  });

  revalidatePath(`/workouts/${dayId}/edit`);
}

export async function removeExerciseFromRoutineAction(formData: FormData) {
  await requireUser();
  const assignmentId = formData.get('assignmentId') as string;
  const dayId = formData.get('dayId') as string;

  if (!assignmentId) throw new Error('Missing assignment ID');

  await db.delete(templateExerciseAssignments).where(eq(templateExerciseAssignments.id, assignmentId));
  
  revalidatePath(`/workouts/${dayId}/edit`);
}