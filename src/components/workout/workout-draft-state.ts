import type { WorkoutDraft, WorkoutExerciseEntryView } from '@/lib/types';

/** Builds a serializable workout draft from local workout UI state. */
export function buildWorkoutDraft(
  sessionId: string,
  sessionNotes: string,
  exercises: WorkoutExerciseEntryView[],
): WorkoutDraft {
  return {
    sessionId,
    sessionNotes,
    exerciseNotes: Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise.notes])),
    sets: exercises.flatMap((exercise) =>
      exercise.sets.map((set) => ({
        setEntryId: set.id,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
        completed: set.completed,
      })),
    ),
    updatedAt: new Date().toISOString(),
  };
}

/** Merges a persisted workout draft into fresh server-rendered workout state. */
export function mergeWorkoutDraft(
  exercises: WorkoutExerciseEntryView[],
  draft: WorkoutDraft,
): WorkoutExerciseEntryView[] {
  const setsById = new Map(draft.sets.map((set) => [set.setEntryId, set]));

  return exercises.map((exercise) => ({
    ...exercise,
    notes: draft.exerciseNotes[exercise.id] ?? exercise.notes,
    sets: exercise.sets.map((set) => {
      const draftSet = setsById.get(set.id);
      return draftSet ? { ...set, ...draftSet } : set;
    }),
  }));
}
