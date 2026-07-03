'use client';

import { useCallback, useMemo, useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Timer, StickyNote } from 'lucide-react';

import {
  addSetAction,
  completeWorkoutSessionAction,
  removeSetAction,
  swapExerciseAction,
  syncWorkoutDraftAction,
} from '@/lib/actions/workout-actions';
import { clearWorkoutDraft } from '@/lib/client/workout-draft-store';
import type { ExerciseCatalogItem, SetEntryView, WorkoutDraft, WorkoutSessionView } from '@/lib/types';
import { ExerciseCard } from '@/components/workout/exercise-card';
import { RestBar } from '@/components/workout/rest-bar';
import { buildWorkoutDraft, mergeWorkoutDraft } from '@/components/workout/workout-draft-state';
import { useWorkoutDraftSync } from '@/components/workout/use-workout-draft-sync';
import { useRestSeconds } from '@/components/workout/use-workout-prefs';

type ActiveWorkoutLoggerProps = {
  session: WorkoutSessionView;
  catalog: ExerciseCatalogItem[];
};

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return `${Math.round(volume)}`;
}

export function ActiveWorkoutLogger({ session, catalog }: ActiveWorkoutLoggerProps): ReactNode {
  const router = useRouter();
  const [exercises, setExercises] = useState(session.exercises);
  const [sessionNotes, setSessionNotes] = useState(session.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [restSeconds, setRestSeconds] = useRestSeconds();
  const [restDismissedAt, setRestDismissedAt] = useState<string | null>(null);
  const [showSessionNotes, setShowSessionNotes] = useState<boolean>(Boolean(session.notes));

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  // Derived session metrics (recomputed only when sets change).
  const { totalSets, doneSets, liveVolume, volumeUnit, latestCompletedAt } = useMemo(() => {
    let total = 0;
    let done = 0;
    let volume = 0;
    let unit = '';
    let latest: string | null = null;
    for (const exercise of exercises) {
      if (!unit && exercise.defaultUnit && exercise.defaultUnit !== 'none') {
        unit = exercise.defaultUnit;
      }
      for (const set of exercise.sets) {
        total += 1;
        if (set.completed) {
          done += 1;
          if (set.kind === 'working' && set.weight && set.reps) {
            volume += set.weight * set.reps;
          }
          if (set.completedAt && (!latest || new Date(set.completedAt).getTime() > new Date(latest).getTime())) {
            latest = set.completedAt;
          }
        }
      }
    }
    return { totalSets: total, doneSets: done, liveVolume: volume, volumeUnit: unit, latestCompletedAt: latest };
  }, [exercises]);

  const completionRatio = totalSets === 0 ? 0 : doneSets / totalSets;
  const ringRadius = 16;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - completionRatio);
  const showRest = latestCompletedAt !== null && latestCompletedAt !== restDismissedAt;
  const allDone = totalSets > 0 && doneSets === totalSets;

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

  const swapExercise = (exerciseEntryId: string, exerciseId: string): void => {
    startTransition(() => {
      swapExerciseAction({ exerciseEntryId, exerciseId }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        setExercises((current) =>
          current.map((exercise) =>
            exercise.id === exerciseEntryId
              ? {
                  ...exercise,
                  selectedExerciseId: result.data.selectedExerciseId,
                  displayName: result.data.displayName,
                  measurementType: result.data.measurementType,
                  defaultUnit: result.data.defaultUnit,
                  images: result.data.images,
                  instructions: result.data.instructions,
                  primaryMuscles: result.data.primaryMuscles,
                  previousPerformance: null,
                }
              : exercise,
          ),
        );
      });
    });
  };

  const addSet = (exerciseEntryId: string): void => {
    startTransition(() => {
      addSetAction({ exerciseEntryId }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        setExercises((current) =>
          current.map((exercise) =>
            exercise.id === exerciseEntryId ? { ...exercise, sets: [...exercise.sets, result.data] } : exercise,
          ),
        );
      });
    });
  };

  const removeSet = (exerciseEntryId: string, setId: string): void => {
    startTransition(() => {
      removeSetAction({ setEntryId: setId }).then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        setExercises((current) =>
          current.map((exercise) =>
            exercise.id === exerciseEntryId
              ? { ...exercise, sets: exercise.sets.filter((set) => set.id !== setId) }
              : exercise,
          ),
        );
      });
    });
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

  const adjustRest = (delta: number): void => {
    setRestSeconds(Math.max(15, Math.min(600, restSeconds + delta)));
  };

  return (
    <div className="space-y-4 text-white">
      <section className="sticky top-[4.5rem] z-20 rounded-[20px] border border-white/[0.08] bg-[#0a0e1a]/85 p-4 shadow-sm backdrop-blur-[20px]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{session.localDate}</p>
            <h1 className="mt-0.5 truncate text-[22px] font-bold tracking-tight">{session.day.muscleGroup}</h1>
            <p className="mt-1 flex items-center gap-2 text-[12px] text-white/50">
              <span className="flex items-center gap-1 font-mono font-semibold text-[#22C55E]">
                <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                {formatClock(elapsedSeconds)}
              </span>
              <span className="text-white/25">·</span>
              <span className="font-mono">
                {formatVolume(liveVolume)}
                {volumeUnit ? ` ${volumeUnit}` : ''} volume
              </span>
            </p>
          </div>
          <div className="relative h-11 w-11 shrink-0" role="img" aria-label={`${doneSets} of ${totalSets} sets complete`}>
            <svg width="44" height="44" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r={ringRadius}
                fill="none"
                stroke="#22C55E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 22 22)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">
              {doneSets}/{totalSets}
            </div>
          </div>
        </div>

        {error ? <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm font-semibold text-red-400">{error}</p> : null}
      </section>

      {exercises.map((exercise, index) => {
        let nextExerciseCompletedAt: string | null | undefined = null;
        for (let i = index + 1; i < exercises.length; i++) {
          const firstCompletedSet = exercises[i].sets.find((s) => s.completed && s.completedAt);
          if (firstCompletedSet) {
            nextExerciseCompletedAt = firstCompletedSet.completedAt;
            break;
          }
        }

        return (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            catalog={catalog}
            pending={isPending}
            nextExerciseCompletedAt={nextExerciseCompletedAt}
            onNotesChange={updateNotes}
            onSetChange={updateSet}
            onSwap={swapExercise}
            onAddSet={addSet}
            onRemoveSet={removeSet}
          />
        );
      })}

      {showSessionNotes ? (
        <label className="block space-y-2 rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Session notes</span>
          <textarea
            className="min-h-24 w-full rounded-[14px] border border-white/10 bg-white/[0.04] p-3 text-[14px] text-white transition-colors placeholder:text-white/30 focus:border-[#22C55E]/50 focus:outline-none"
            maxLength={4000}
            autoFocus={!session.notes}
            onChange={(event) => setSessionNotes(event.currentTarget.value)}
            placeholder="Energy, sleep, warmup, injuries, or overall performance."
            value={sessionNotes}
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setShowSessionNotes(true)}
          className="flex items-center gap-1.5 rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] font-semibold text-white/50 transition-colors hover:text-white"
        >
          <StickyNote className="h-4 w-4" /> Add session note
        </button>
      )}

      <div className="sticky bottom-24 z-30 space-y-2">
        {showRest && latestCompletedAt ? (
          <RestBar
            startedAtIso={latestCompletedAt}
            restSeconds={restSeconds}
            onSkip={() => setRestDismissedAt(latestCompletedAt)}
            onAdjust={adjustRest}
          />
        ) : null}
        <div className="rounded-[24px] border border-white/[0.08] bg-[#0a0e1a]/85 p-3 backdrop-blur-[20px]">
          <button
            className={
              'h-14 w-full rounded-[16px] bg-[#22C55E] text-[15px] font-bold text-black transition-all disabled:opacity-60' +
              (allDone ? ' shadow-[0_0_24px_rgba(34,197,94,0.4)]' : '')
            }
            disabled={isPending}
            onClick={completeWorkout}
            type="button"
          >
            {session.status === 'completed' ? 'Save completed session' : 'Finish workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
