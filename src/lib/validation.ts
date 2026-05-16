import { z } from 'zod';

import { isValidTimezone } from '@/lib/timezone';

export const unitPreferenceSchema = z.enum(['lb', 'kg']);
export const themePreferenceSchema = z.enum(['light', 'dark', 'rose']);

export const settingsSchema = z.object({
  unit: unitPreferenceSchema,
  theme: themePreferenceSchema,
  timezone: z.string().min(1).refine(isValidTimezone, 'Invalid timezone.'),
});

export const startWorkoutSchema = z.object({
  dayId: z.string().min(1),
});

export const setEntryUpdateSchema = z.object({
  setEntryId: z.string().min(1),
  weight: z.number().min(0).max(2000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  rpe: z.number().min(0).max(10).nullable(),
  completed: z.boolean(),
});

export const exerciseNotesSchema = z.object({
  exerciseEntryId: z.string().min(1),
  notes: z.string().max(2000),
});

export const sessionNotesSchema = z.object({
  sessionId: z.string().min(1),
  notes: z.string().max(4000),
});

export const completeSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export const syncWorkoutDraftSchema = z.object({
  sessionId: z.string().min(1),
  sessionNotes: z.string().max(4000),
  exerciseNotes: z.record(z.string().min(1), z.string().max(2000)),
  sets: z.array(setEntryUpdateSchema).max(100),
});

/** Parses and validates user settings mutation input. */
export function parseSettingsInput(input: unknown): z.infer<typeof settingsSchema> {
  return settingsSchema.parse(input);
}

/** Parses and validates set entry mutation input. */
export function parseSetEntryUpdateInput(input: unknown): z.infer<typeof setEntryUpdateSchema> {
  return setEntryUpdateSchema.parse(input);
}

/** Parses and validates draft sync mutation input. */
export function parseSyncWorkoutDraftInput(input: unknown): z.infer<typeof syncWorkoutDraftSchema> {
  return syncWorkoutDraftSchema.parse(input);
}
