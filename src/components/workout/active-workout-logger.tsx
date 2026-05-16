'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { completeWorkoutSessionAction, syncWorkoutDraftAction } from '@/lib/actions/workout-actions';
import { clearWorkoutDraft } from '@/lib/client/workout-draft-store';
import type { SetEntryView, WorkoutDraft, WorkoutExerciseEntryView, WorkoutSessionView } from '@/lib/types';
import { ExerciseCard } from '@/components/workout/exercise-card';
import { buildWorkoutDraft, mergeWorkoutDraft } from '@/components/workout/workout-draft-state';
import { useWorkoutDraftSync } from '@/components/workout/use-workout-draft-sync';

type ActiveWorkoutLoggerProps = {
  session: WorkoutSessionView;
};

function calculateCompletion(exercises: WorkoutExerciseEntryView[]): number {
  const allSets = exercises.flatMap((exercise) => exercise.sets);
  const doneSets = allSets.filter((set) => set.completed).length;
  return allSets.length === 0 ? 0 : Math.round((doneSets / allSets.length) * 100);
}

/** Renders the active workout logging experience with local draft persistence. */
export function ActiveWorkoutLogger({ session }: ActiveWorkoutLoggerProps): ReactNode {
  const router = useRouter();
  const [exercises, setExercises] = useState(session.exercises);
  const [sessionNotes, setSessionNotes] = useState(session.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const completion = useMemo(() => calculateCompletion(exercises), [exercises]);

  const handleDraftLoaded = useCallback((draft: WorkoutDraft): void => {
    setSessionNotes(draft.sessionNotes);
    setExercises((current) => mergeWorkoutDraft(current, draft));
  }, []);

  useWorkoutDraftSync({
    sessionId: session.id,
    sessionNotes,
    exercises,
    onDraftLoaded: handleDraftLoaded,
    onError: setError,
  });

  const updateSet = (exerciseEntryId: string, nextSet: SetEntryView): void => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id === exerciseEntryId
          ? { ...exercise, sets: exercise.sets.map((set) => (set.id === nextSet.id ? nextSet : set)) }
          : exercise,
      ),
    );
  };

  const updateNotes = (exerciseEntryId: string, notes: string): void => {
    setExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseEntryId ? { ...exercise, notes } : exercise)),
    );
  };

  const completeWorkout = (): void => {
    const draft = buildWorkoutDraft(session.id, sessionNotes, exercises);
    startTransition(() => {
      syncWorkoutDraftAction(draft).then((syncResult) => {
        if (!syncResult.ok) {
          setError(syncResult.error);
          return;
        }

        completeWorkoutSessionAction({ sessionId: session.id }).then((completeResult) => {
          if (!completeResult.ok) {
            setError(completeResult.error);
            return;
          }

          void clearWorkoutDraft(session.id);
          router.push('/history');
          router.refresh();
        });
      });
    });
  };

  return (
    <div className="space-y-4">
      <section className="sticky top-[4.5rem] z-20 rounded-3xl border border-border bg-background/90 p-4 shadow-glow backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{session.localDate}</p>
            <h1 className="text-2xl font-black tracking-tight">{session.day.muscleGroup}</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{completion}%</div>
            <div className="text-xs font-bold text-muted">complete</div>
          </div>
        </div>
        {error ? <p className="mt-3 rounded-2xl bg-danger/15 p-3 text-sm font-semibold text-danger">{error}</p> : null}
      </section>

      {exercises.map((exercise) => (
        <ExerciseCard exercise={exercise} key={exercise.id} onNotesChange={updateNotes} onSetChange={updateSet} />
      ))}

      <label className="block space-y-2 rounded-3xl border border-border bg-card/80 p-4 backdrop-blur">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Session notes</span>
        <textarea
          className="min-h-24 w-full rounded-2xl border-border bg-background/55 text-sm focus:border-primary focus:ring-primary"
          maxLength={4000}
          onChange={(event) => setSessionNotes(event.currentTarget.value)}
          placeholder="Energy, sleep, warmup, injuries, or overall performance."
          value={sessionNotes}
        />
      </label>

      <div className="sticky bottom-24 z-30 rounded-3xl border border-border bg-background/90 p-3 backdrop-blur-xl">
        <button
          className="h-14 w-full rounded-2xl bg-primary text-sm font-black uppercase tracking-[0.18em] text-background shadow-glow disabled:opacity-60"
          disabled={isPending}
          onClick={completeWorkout}
          type="button"
        >
          {session.status === 'completed' ? 'Save completed session' : 'Complete workout'}
        </button>
      </div>
    </div>
  );
}
