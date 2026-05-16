'use client';

import type { ReactNode } from 'react';

import { SetEntryRow } from '@/components/workout/set-entry-row';
import type { SetEntryView, WorkoutExerciseEntryView } from '@/lib/types';

type ExerciseCardProps = {
  exercise: WorkoutExerciseEntryView;
  onSetChange: (exerciseId: string, set: SetEntryView) => void;
  onNotesChange: (exerciseId: string, notes: string) => void;
};

/** Renders an exercise block with set logging and previous performance. */
export function ExerciseCard({ exercise, onSetChange, onNotesChange }: ExerciseCardProps): ReactNode {
  const previous = exercise.previousPerformance;

  return (
    <section className="space-y-3 rounded-3xl border border-border bg-card/80 p-4 shadow-glow backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Exercise {exercise.position}</p>
          <h2 className="text-xl font-black tracking-tight">{exercise.displayName}</h2>
          {exercise.targetNote ? <p className="mt-1 text-sm text-muted">{exercise.targetNote}</p> : null}
        </div>
        <div className="rounded-2xl border border-border bg-background/60 px-3 py-2 text-right text-xs font-bold text-muted">
          {previous ? (
            <>
              <div>Previous</div>
              <div className="text-foreground">
                {previous.weight} {previous.unit} × {previous.reps}
              </div>
            </>
          ) : (
            <div>No prior sets</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {exercise.sets.map((set) => (
          <SetEntryRow key={set.id} set={set} onChange={(nextSet) => onSetChange(exercise.id, nextSet)} />
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Exercise notes</span>
        <textarea
          className="min-h-20 w-full rounded-2xl border-border bg-background/55 text-sm focus:border-primary focus:ring-primary"
          maxLength={2000}
          onChange={(event) => onNotesChange(exercise.id, event.currentTarget.value)}
          placeholder="Technique, pain, substitutions, cues."
          value={exercise.notes}
        />
      </label>
    </section>
  );
}
