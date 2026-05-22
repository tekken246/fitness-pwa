'use client';

import type { ReactNode } from 'react';

import { SetEntryRow } from '@/components/workout/set-entry-row';
import type { SetEntryView, WorkoutExerciseEntryView } from '@/lib/types';

type ExerciseCardProps = {
  exercise: WorkoutExerciseEntryView;
  nextExerciseCompletedAt?: string | null | Date;
  onSetChange: (exerciseId: string, set: SetEntryView) => void;
  onNotesChange: (exerciseId: string, notes: string) => void;
};

/** Renders an exercise block with set logging and previous performance. */
export function ExerciseCard({ exercise, nextExerciseCompletedAt, onSetChange, onNotesChange }: ExerciseCardProps): ReactNode {
  const previous = exercise.previousPerformance;

  return (
    <section className="space-y-4 rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-5 shadow-sm transition-all hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Exercise {exercise.position}</p>
          <h2 className="mt-1 text-[20px] font-bold tracking-tight text-white">{exercise.displayName}</h2>
          {exercise.targetNote ? <p className="mt-1 text-[13px] text-white/50">{exercise.targetNote}</p> : null}
        </div>
        <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-right">
          {previous ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Previous</div>
              <div className="mt-0.5 text-[13px] font-semibold text-white/80">
                {previous.weight} {previous.unit !== 'none' ? previous.unit : ''} × {previous.reps}
              </div>
            </>
          ) : (
            <div className="text-[11px] font-semibold text-white/40 pt-1">No prior sets</div>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {exercise.sets.map((set, index) => {
          const nextSet = exercise.sets[index + 1];
          
          // If this is the last set of the exercise, use the cross-exercise look-ahead time!
          const resolvedNextCompletedAt = nextSet?.completedAt || (index === exercise.sets.length - 1 ? nextExerciseCompletedAt : null);

          return (
            <SetEntryRow 
              key={set.id} 
              set={set} 
              nextSetCompletedAt={resolvedNextCompletedAt}
              onChange={(nextSet) => onSetChange(exercise.id, nextSet)} 
            />
          );
        })}
      </div>

      <label className="block space-y-2 pt-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45 px-1">Exercise notes</span>
        <textarea
          className="min-h-[80px] w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-3 text-[14px] text-white focus:border-[#22C55E]/50 focus:outline-none transition-colors placeholder:text-white/30"
          maxLength={2000}
          onChange={(event) => onNotesChange(exercise.id, event.currentTarget.value)}
          placeholder="Technique, pain, substitutions, cues."
          value={exercise.notes}
        />
      </label>
    </section>
  );
}