'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { workoutTemplateDays, workoutTemplates } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';

export async function createFlexibleRoutineAction(formData: FormData) {
  const user = await requireClerkUserId();
  const name = formData.get('name') as string;
  const muscleGroup = formData.get('muscleGroup') as string;

  if (!name || !muscleGroup) {
    throw new Error('Name and muscle group are required');
  }

  const templateId = `tpl_${crypto.randomUUID()}`;
  const dayId = `day_${crypto.randomUUID()}`;

  // 1. Create a parent template container (version 1)
  await db.insert(workoutTemplates).values({
    id: templateId,
    name: name,
    version: 1,
    source: 'custom',
    isSeed: false,
  });

  // 2. Create the floating routine (dayOfWeek is omitted/null)
  await db.insert(workoutTemplateDays).values({
    id: dayId,
    templateId: templateId,
    displayOrder: 1,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: name,
    muscleGroup: muscleGroup,
    isRestDay: false,
    isOptional: false,
  });

  revalidatePath('/workouts');
  redirect(`/workouts/${dayId}/edit`); // Redirects to a builder page
}