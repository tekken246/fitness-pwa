'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { SetEntryRow } from '@/components/workout/set-entry-row';
import type { SetEntryView, WorkoutExerciseEntryView } from '@/lib/types';
import { getExerciseFallback } from '@/lib/data/exercise-help';
import { ExerciseHelpButton, ExerciseHelpSheet } from '@/components/workout/exercise-help-sheet';

// Safely parses database string arrays, preventing JSON errors
function parseDbArray(value: any): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface ExerciseCardProps {
  exercise: WorkoutExerciseEntryView;
  // ACCEPT STRING: Fixes the Vercel build error
  nextExerciseCompletedAt?: string | Date | null; 
  onSetChange: (exerciseId: string, set: SetEntryView) => void;
  onNotesChange: (exerciseId: string, notes: string) => void;
}

export function ExerciseCard({
  exercise,
  nextExerciseCompletedAt,
  onSetChange,
  onNotesChange
}: ExerciseCardProps): ReactNode {
  const previous = exercise.previousPerformance;
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Safely parse data coming from the database
  const dbImages = parseDbArray(exercise.images);
  const dbInstructions = parseDbArray(exercise.instructions);
  const dbMuscles = parseDbArray(exercise.primaryMuscles);

  // Get our smart fallback data using fuzzy matching
  const fallback = getExerciseFallback(exercise.displayName);

  // Compile the final data object for the Help Sheet tooltip
  const sheetData = {
    name: exercise.displayName,
    // Prefer database images, fall back to smart dictionary, default to empty array
    images: dbImages && dbImages.length > 0 ? dbImages : (fallback?.images || []),

    // Prefer database instructions, fall back to smart dictionary, default to generic text
    instructions: dbInstructions && dbInstructions.length > 0
      ? dbInstructions
      : (fallback ? [...fallback.setup, ...fallback.execution] : ['Specific visual instructions for this custom exercise variation are currently unavailable.']),

    // Prefer database muscles, fall back to smart dictionary, default to empty array
    primaryMuscles: dbMuscles && dbMuscles.length > 0 ? dbMuscles : (fallback?.targetMuscles || [])
  };

  return (
    <section className="space-y-4 rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-5 shadow-sm transition-all hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">Exercise {exercise.position}</p>
            {/* Always render the button now */}
            <ExerciseHelpButton onClick={() => setIsHelpOpen(true)} exerciseName={exercise.displayName} />
          </div>
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

      <ExerciseHelpSheet
        exerciseData={sheetData}
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </section>
  );
}