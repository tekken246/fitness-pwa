'use client';

import { useCallback, useMemo, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Timer } from 'lucide-react'; // Added Icon

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

export function ActiveWorkoutLogger({ session }: ActiveWorkoutLoggerProps): ReactNode {
  const router = useRouter();
  const [exercises, setExercises] = useState(session.exercises);
  const [sessionNotes, setSessionNotes] = useState(session.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const completion = useMemo(() => calculateCompletion(exercises), [exercises]);

  // --- NEW: Main Workout Timer Logic ---
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    // Start ticking from the exact moment the session was created in the database
    const startTime = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const formatWorkoutTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  // ------------------------------------

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
      <section className="sticky top-[4.5rem] z-20 rounded-[20px] border border-white/[0.08] bg-[#0a0e1a]/85 p-4 shadow-sm backdrop-blur-[20px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{session.localDate}</p>
            <h1 className="text-[24px] font-bold tracking-tight mt-0.5">{session.day.muscleGroup}</h1>
          </div>
          <div className="text-right">
            {/* Live Timer Rendered Here */}
            <div className="flex items-center justify-end gap-1.5 text-[#22C55E] mb-1">
               <Timer className="h-3.5 w-3.5" />
               <span className="text-[13px] font-bold font-mono tracking-wider">{formatWorkoutTime(elapsedSeconds)}</span>
            </div>
            <div className="text-[20px] font-bold leading-none">{completion}%</div>
          </div>
        </div>
        {error ? <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-400">{error}</p> : null}
      </section>

      {exercises.map((exercise) => (
        <ExerciseCard exercise={exercise} key={exercise.id} onNotesChange={updateNotes} onSetChange={updateSet} />
      ))}

      <label className="block space-y-2 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Session notes</span>
        <textarea
          className="min-h-24 w-full rounded-[14px] border border-white/10 bg-white/[0.04] p-3 text-[14px] text-white focus:border-[#22C55E]/50 focus:outline-none transition-colors placeholder:text-white/30"
          maxLength={4000}
          onChange={(event) => setSessionNotes(event.currentTarget.value)}
          placeholder="Energy, sleep, warmup, injuries, or overall performance."
          value={sessionNotes}
        />
      </label>

      <div className="sticky bottom-24 z-30 rounded-[24px] border border-white/[0.08] bg-[#0a0e1a]/85 p-3 backdrop-blur-[20px]">
        <button
          className="h-14 w-full rounded-[16px] bg-[#22C55E] text-[15px] font-bold text-black disabled:opacity-60 transition-opacity"
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