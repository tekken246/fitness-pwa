'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getOrCreateUserSettings } from '@/lib/data/settings';
import { getTemplateDayByIsoWeekday } from '@/lib/data/workout-templates';
import { getUsableTemplateDay } from '@/lib/data/routine-access';
import { enforceRateLimit } from '@/lib/rate-limit';
import {
  addSetForUser,
  completeWorkoutSessionForUser,
  removeSetForUser,
  startWorkoutSessionForDay,
  syncWorkoutDraftForUser,
  updateExerciseNotesForUser,
  updateSelectedExerciseForUser,
  updateSessionNotesForUser,
  updateSetEntryForUser,
} from '@/lib/data/workout-sessions';
import { toErrorMessage } from '@/lib/errors';
import { requireClerkUserId } from '@/lib/auth';
import type { SetEntryView } from '@/lib/types';
import { getIsoWeekdayForTimezone, getLocalDateForTimezone } from '@/lib/timezone';
import {
  addSetSchema,
  completeSessionSchema,
  exerciseNotesSchema,
  parseSetEntryUpdateInput,
  parseSyncWorkoutDraftInput,
  removeSetSchema,
  sessionNotesSchema,
  startWorkoutSchema,
  swapExerciseSchema,
} from '@/lib/validation';

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export type ActionDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type SwapExerciseData = {
  selectedExerciseId: string;
  displayName: string;
  measurementType: string;
  defaultUnit: SetEntryView['unit'];
  primaryMuscles: string[];
  images: string[];
  instructions: string[];
};

/** Starts or resumes today's workout and redirects to the active session. */
export async function startTodayWorkoutAction(): Promise<void> {
  const clerkUserId = await requireClerkUserId();
  await enforceRateLimit(clerkUserId, 'workout-start');
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
  await enforceRateLimit(clerkUserId, 'workout-start');
  // Only the shared seed plan or a routine the user owns can be started.
  // Prevents starting a session against another user's private routine via a forged dayId.
  await getUsableTemplateDay(parsed.dayId, clerkUserId);
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
    await enforceRateLimit(clerkUserId, 'session-write');
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
    await enforceRateLimit(clerkUserId, 'session-write');
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
    await enforceRateLimit(clerkUserId, 'session-write');
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
    await enforceRateLimit(clerkUserId, 'session-write');
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
    await enforceRateLimit(clerkUserId, 'session-write');
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

/** Swaps the performed exercise for an entry (e.g. to a prescribed alternative). */
export async function swapExerciseAction(input: unknown): Promise<ActionDataResult<SwapExerciseData>> {
  try {
    const parsed = swapExerciseSchema.parse(input);
    const clerkUserId = await requireClerkUserId();
    await enforceRateLimit(clerkUserId, 'session-write');
    const data = await updateSelectedExerciseForUser(clerkUserId, parsed.exerciseEntryId, parsed.exerciseId);
    revalidatePath('/progress');
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Appends a working set to an exercise entry mid-workout. */
export async function addSetAction(input: unknown): Promise<ActionDataResult<SetEntryView>> {
  try {
    const parsed = addSetSchema.parse(input);
    const clerkUserId = await requireClerkUserId();
    await enforceRateLimit(clerkUserId, 'session-write');
    const data = await addSetForUser(clerkUserId, parsed.exerciseEntryId);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Removes a set entry mid-workout. */
export async function removeSetAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = removeSetSchema.parse(input);
    const clerkUserId = await requireClerkUserId();
    await enforceRateLimit(clerkUserId, 'session-write');
    await removeSetForUser(clerkUserId, parsed.setEntryId);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
