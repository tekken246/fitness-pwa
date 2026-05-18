'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
// 1. Added workoutSessions to the import
import { workoutTemplateDays, workoutTemplates, templateExerciseAssignments, workoutSessions } from '@/db/schema'; 
import { requireClerkUserId } from '@/lib/auth';

export async function createFlexibleRoutineAction(formData: FormData) {
  await requireClerkUserId(); 
  const name = formData.get('name') as string;
  const muscleGroup = formData.get('muscleGroup') as string;

  if (!name || !muscleGroup) {
    throw new Error('Name and muscle group are required');
  }

  const templateId = `tpl_${crypto.randomUUID()}`;
  const dayId = `day_${crypto.randomUUID()}`;
  const uniqueHash = crypto.randomUUID().slice(0, 6);

  await db.insert(workoutTemplates).values({
    id: templateId,
    name: `${name}-${uniqueHash}`, 
    version: 1,
    source: 'custom',
  });

  await db.insert(workoutTemplateDays).values({
    id: dayId,
    templateId: templateId,
    displayOrder: 1,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uniqueHash}`,
    name: name, 
    muscleGroup: muscleGroup,
    isRestDay: false,
    isOptional: false,
  });

  revalidatePath('/workouts');
  redirect(`/workouts/${dayId}/edit`);
}

export async function deleteFlexibleRoutineAction(formData: FormData) {
  await requireClerkUserId();
  const dayId = formData.get('dayId') as string;
  const templateId = formData.get('templateId') as string;

  if (!dayId || !templateId) throw new Error('Missing routine IDs');

  // 1. Delete associated workout sessions first to remove foreign key locks.
  // Because the schema uses onDelete: 'cascade' for entries and sets, this single line cleans up the whole history.
  await db.delete(workoutSessions).where(eq(workoutSessions.templateDayId, dayId));

  // 2. Safely delete the routine data now that the locks are removed.
  await db.delete(templateExerciseAssignments).where(eq(templateExerciseAssignments.dayId, dayId));
  await db.delete(workoutTemplateDays).where(eq(workoutTemplateDays.id, dayId));
  await db.delete(workoutTemplates).where(eq(workoutTemplates.id, templateId));

  revalidatePath('/workouts');
  redirect('/workouts');
}