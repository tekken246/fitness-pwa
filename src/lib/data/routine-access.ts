import 'server-only';

import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { workoutTemplateDays, workoutTemplates } from '@/db/schema';
import { AppError } from '@/lib/errors';

export type TemplateDayOwnership = {
  dayId: string;
  templateId: string;
  ownerClerkUserId: string | null;
  isSeed: boolean;
};

async function loadTemplateDayOwnership(dayId: string): Promise<TemplateDayOwnership | null> {
  const rows = await db
    .select({
      dayId: workoutTemplateDays.id,
      templateId: workoutTemplates.id,
      ownerClerkUserId: workoutTemplates.ownerClerkUserId,
      isSeed: workoutTemplates.isSeed,
    })
    .from(workoutTemplateDays)
    .innerJoin(workoutTemplates, eq(workoutTemplates.id, workoutTemplateDays.templateId))
    .where(eq(workoutTemplateDays.id, dayId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Returns the template day only if the user may *use* it (read it / start a session
 * against it): the shared seed plan, or a routine the user owns. Throws otherwise.
 */
export async function getUsableTemplateDay(
  dayId: string,
  clerkUserId: string,
): Promise<TemplateDayOwnership> {
  const day = await loadTemplateDayOwnership(dayId);

  if (!day) {
    throw new AppError('not_found', 'Workout day was not found.');
  }

  if (!day.isSeed && day.ownerClerkUserId !== clerkUserId) {
    throw new AppError('forbidden', 'You do not have access to this routine.');
  }

  return day;
}

/**
 * Returns the template day only if the user may *edit* it: a routine they own that is
 * not part of the read-only seed plan. Throws otherwise. The seed plan is never editable.
 */
export async function assertEditableTemplateDay(
  dayId: string,
  clerkUserId: string,
): Promise<TemplateDayOwnership> {
  const day = await loadTemplateDayOwnership(dayId);

  if (!day) {
    throw new AppError('not_found', 'Routine was not found.');
  }

  if (day.isSeed) {
    throw new AppError('forbidden', 'The seed plan is read-only. Create your own routine to customise it.');
  }

  if (day.ownerClerkUserId !== clerkUserId) {
    throw new AppError('forbidden', 'You can only edit your own routines.');
  }

  return day;
}
