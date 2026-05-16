import { describe, expect, it } from 'vitest';

import { parseSetEntryUpdateInput, parseSettingsInput, parseSyncWorkoutDraftInput } from '@/lib/validation';

describe('workout mutation validation', () => {
  it('accepts valid set updates', () => {
    expect(
      parseSetEntryUpdateInput({ setEntryId: 'set_1', weight: 135, reps: 8, rpe: 8.5, completed: true }),
    ).toEqual({ setEntryId: 'set_1', weight: 135, reps: 8, rpe: 8.5, completed: true });
  });

  it('rejects invalid set updates', () => {
    expect(() =>
      parseSetEntryUpdateInput({ setEntryId: 'set_1', weight: -1, reps: 8, rpe: 8, completed: true }),
    ).toThrow();
  });

  it('accepts valid settings', () => {
    expect(parseSettingsInput({ unit: 'lb', theme: 'rose', timezone: 'UTC' })).toEqual({
      unit: 'lb',
      theme: 'rose',
      timezone: 'UTC',
    });
  });

  it('limits offline draft batch size', () => {
    expect(() =>
      parseSyncWorkoutDraftInput({
        sessionId: 'session_1',
        sessionNotes: '',
        exerciseNotes: {},
        sets: Array.from({ length: 101 }, (_, index) => ({
          setEntryId: `set_${index}`,
          weight: 100,
          reps: 10,
          rpe: null,
          completed: true,
        })),
      }),
    ).toThrow();
  });
});
