'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/db/client';
import { workoutTemplateDays, workoutTemplates, templateExerciseAssignments, workoutSessions } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';
import { assertEditableTemplateDay } from '@/lib/data/routine-access';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function createFlexibleRoutineAction(formData: FormData) {
  const clerkUserId = await requireClerkUserId();
  await enforceRateLimit(clerkUserId, 'routine-write');

  const name = (formData.get('name') as string | null)?.trim();
  const muscleGroup = (formData.get('muscleGroup') as string | null)?.trim();

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
    ownerClerkUserId: clerkUserId, // private to the creator (is_seed defaults to false)
  });

  await db.insert(workoutTemplateDays).values({
    id: dayId,
    templateId,
    displayOrder: 1,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uniqueHash}`,
    name,
    muscleGroup,
    isRestDay: false,
    isOptional: false,
  });

  revalidatePath('/workouts');
  redirect(`/workouts/${dayId}/edit`);
}

export async function deleteFlexibleRoutineAction(formData: FormData) {
  const clerkUserId = await requireClerkUserId();
  await enforceRateLimit(clerkUserId, 'routine-write');

  const dayId = formData.get('dayId') as string | null;
  if (!dayId) throw new Error('Missing routine id');

  // Authorise: must be a routine THIS user owns (never the seed, never another user's).
  // templateId is derived from the authorised record, never trusted from the form.
  const { templateId } = await assertEditableTemplateDay(dayId, clerkUserId);

  // Delete only this user's sessions for the day (cascades to entries + sets).
  // Never delete other users' sessions.
  await db
    .delete(workoutSessions)
    .where(and(eq(workoutSessions.templateDayId, dayId), eq(workoutSessions.clerkUserId, clerkUserId)));

  await db.delete(templateExerciseAssignments).where(eq(templateExerciseAssignments.dayId, dayId));
  await db.delete(workoutTemplateDays).where(eq(workoutTemplateDays.id, dayId));
  await db.delete(workoutTemplates).where(eq(workoutTemplates.id, templateId));

  revalidatePath('/workouts');
  redirect('/workouts');
}
