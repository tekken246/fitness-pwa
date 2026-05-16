'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getOrCreateUserSettings } from '@/lib/data/settings';
import { getTemplateDayByIsoWeekday } from '@/lib/data/workout-templates';
import {
  completeWorkoutSessionForUser,
  startWorkoutSessionForDay,
  syncWorkoutDraftForUser,
  updateExerciseNotesForUser,
  updateSessionNotesForUser,
  updateSetEntryForUser,
} from '@/lib/data/workout-sessions';
import { toErrorMessage } from '@/lib/errors';
import { requireClerkUserId } from '@/lib/auth';
import { getIsoWeekdayForTimezone, getLocalDateForTimezone } from '@/lib/timezone';
import {
  completeSessionSchema,
  exerciseNotesSchema,
  parseSetEntryUpdateInput,
  parseSyncWorkoutDraftInput,
  sessionNotesSchema,
  startWorkoutSchema,
} from '@/lib/validation';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** Starts or resumes today's workout and redirects to the active session. */
export async function startTodayWorkoutAction(): Promise<void> {
  const clerkUserId = await requireClerkUserId();
  const settings = await getOrCreateUserSettings(clerkUserId);
  const now = new Date();
  const localDate = getLocalDateForTimezone(now, settings.timezone);
  const dayOfWeek = getIsoWeekdayForTimezone(now, settings.timezone);
  const day = await getTemplateDayByIsoWeekday(dayOfWeek);

  const sessionId = await startWorkoutSessionForDay(
    clerkUserId,
    day.id,
    localDate,
    settings.timezone,
    settings.unit,
  );

  revalidatePath('/today');
  redirect(`/sessions/${sessionId}`);
}

/** Starts or resumes a selected workout day and redirects to the active session. */
export async function startWorkoutForDayAction(formData: FormData): Promise<void> {
  const parsed = startWorkoutSchema.parse({ dayId: formData.get('dayId') });
  const clerkUserId = await requireClerkUserId();
  const settings = await getOrCreateUserSettings(clerkUserId);
  const localDate = getLocalDateForTimezone(new Date(), settings.timezone);
  const sessionId = await startWorkoutSessionForDay(
    clerkUserId,
    parsed.dayId,
    localDate,
    settings.timezone,
    settings.unit,
  );

  revalidatePath('/workouts');
  redirect(`/sessions/${sessionId}`);
}

/** Updates a single set entry after server-side validation and ownership checks. */
export async function updateSetEntryAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = parseSetEntryUpdateInput(input);
    const clerkUserId = await requireClerkUserId();
    await updateSetEntryForUser(clerkUserId, parsed);
    revalidatePath('/progress');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Updates exercise-level notes after server-side validation and ownership checks. */
export async function updateExerciseNotesAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = exerciseNotesSchema.parse(input);
    const clerkUserId = await requireClerkUserId();
    await updateExerciseNotesForUser(clerkUserId, parsed.exerciseEntryId, parsed.notes);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Updates session-level notes after server-side validation and ownership checks. */
export async function updateSessionNotesAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = sessionNotesSchema.parse(input);
    const clerkUserId = await requireClerkUserId();
    await updateSessionNotesForUser(clerkUserId, parsed.sessionId, parsed.notes);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Completes a workout session while keeping set entries editable later. */
export async function completeWorkoutSessionAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = completeSessionSchema.parse(input);
    const clerkUserId = await requireClerkUserId();
    await completeWorkoutSessionForUser(clerkUserId, parsed.sessionId);
    revalidatePath('/history');
    revalidatePath('/progress');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Syncs an offline workout draft after connectivity returns. */
export async function syncWorkoutDraftAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = parseSyncWorkoutDraftInput(input);
    const clerkUserId = await requireClerkUserId();
    await syncWorkoutDraftForUser(
      clerkUserId,
      parsed.sessionId,
      parsed.sessionNotes,
      parsed.exerciseNotes,
      parsed.sets,
    );
    revalidatePath(`/sessions/${parsed.sessionId}`);
    revalidatePath('/progress');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
