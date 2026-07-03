'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, RefreshCw, ArrowDownToLine, StickyNote } from 'lucide-react';

import { SetEntryRow } from '@/components/workout/set-entry-row';
import type { ExerciseCatalogItem, SetEntryView, WorkoutExerciseEntryView } from '@/lib/types';
import { calculateEstimatedOneRepMax } from '@/lib/progress';
import { getExerciseFallback } from '@/lib/data/exercise-help';
import { ExerciseHelpButton, ExerciseHelpSheet } from '@/components/workout/exercise-help-sheet';
import { ExerciseSwapSheet } from '@/components/workout/exercise-swap-sheet';

// Safely parses database string arrays, preventing JSON errors
function parseDbArray(value: unknown): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value as string);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export interface ExerciseCardProps {
  exercise: WorkoutExerciseEntryView;
  nextExerciseCompletedAt?: string | Date | null;
  catalog: ExerciseCatalogItem[];
  pending: boolean;
  onSetChange: (exerciseId: string, set: SetEntryView) => void;
  onNotesChange: (exerciseId: string, notes: string) => void;
  onSwap: (exerciseEntryId: string, exerciseId: string) => void;
  onAddSet: (exerciseEntryId: string) => void;
  onRemoveSet: (exerciseEntryId: string, setId: string) => void;
}

export function ExerciseCard({
  exercise,
  nextExerciseCompletedAt,
  catalog,
  pending,
  onSetChange,
  onNotesChange,
  onSwap,
  onAddSet,
  onRemoveSet,
}: ExerciseCardProps): ReactNode {
  const previous = exercise.previousPerformance;
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSwapOpen, setIsSwapOpen] = useState(false);
  const [showNotes, setShowNotes] = useState<boolean>(Boolean(exercise.notes));

  const dbImages = parseDbArray(exercise.images);
  const dbInstructions = parseDbArray(exercise.instructions);
  const dbMuscles = parseDbArray(exercise.primaryMuscles);

  const fallback = getExerciseFallback(exercise.displayName);

  const sheetData = {
    name: exercise.displayName,
    images: dbImages && dbImages.length > 0 ? dbImages : fallback?.images || [],
    instructions:
      dbInstructions && dbInstructions.length > 0
        ? dbInstructions
        : fallback
          ? [...fallback.setup, ...fallback.execution]
          : ['Specific visual instructions for this custom exercise variation are currently unavailable.'],
    primaryMuscles: dbMuscles && dbMuscles.length > 0 ? dbMuscles : fallback?.targetMuscles || [],
  };

  // Personal-record detection: the best completed working-set e1RM in this session
  // that also beats the last recorded performance. Exactly one set is flagged.
  const prevBestE1rm = previous ? calculateEstimatedOneRepMax(previous.weight, previous.reps) : 0;
  let bestE1rm = 0;
  for (const s of exercise.sets) {
    if (s.kind === 'working' && s.completed && s.weight && s.reps) {
      bestE1rm = Math.max(bestE1rm, calculateEstimatedOneRepMax(s.weight, s.reps));
    }
  }
  let prSetId: string | null = null;
  if (bestE1rm > 0 && bestE1rm > prevBestE1rm) {
    for (const s of exercise.sets) {
      if (s.kind === 'working' && s.completed && s.weight && s.reps && calculateEstimatedOneRepMax(s.weight, s.reps) === bestE1rm) {
        prSetId = s.id;
        break;
      }
    }
  }

  const fillFromPrevious = (): void => {
    if (!previous) return;
    for (const set of exercise.sets) {
      if (!set.completed) {
        onSetChange(exercise.id, { ...set, weight: previous.weight, reps: previous.reps });
      }
    }
  };

  const weightUnitLabel = exercise.defaultUnit && exercise.defaultUnit !== 'none' ? exercise.defaultUnit.toUpperCase() : 'KG';

  return (
    <section className="space-y-4 rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-5 shadow-sm transition-all hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-[#22C55E]/15 text-[12px] font-bold text-[#22C55E]">
              {exercise.position}
            </span>
            <ExerciseHelpButton onClick={() => setIsHelpOpen(true)} exerciseName={exercise.displayName} />
            <button
              type="button"
              onClick={() => setIsSwapOpen(true)}
              disabled={pending}
              aria-label={`Swap ${exercise.displayName}`}
              className="flex h-7 items-center gap-1 rounded-full border border-white/[0.14] bg-white/[0.05] px-2 text-[11px] font-bold text-white/70 transition-colors hover:text-white disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" /> Swap
            </button>
          </div>
          <h2 className="mt-1.5 truncate text-[18px] font-bold tracking-tight text-white">{exercise.displayName}</h2>
          {exercise.targetNote ? <p className="mt-0.5 text-[13px] text-white/50">{exercise.targetNote}</p> : null}
        </div>
        <div className="shrink-0 rounded-[12px] border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-right">
          {previous ? (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Last time</div>
              <div className="mt-0.5 text-[13px] font-semibold text-white/80">
                {previous.weight} {previous.unit !== 'none' ? previous.unit : ''} × {previous.reps}
              </div>
              <button
                type="button"
                onClick={fillFromPrevious}
                className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#22C55E] hover:opacity-80"
              >
                <ArrowDownToLine className="h-3 w-3" /> Fill all
              </button>
            </>
          ) : (
            <div className="pt-1 text-[11px] font-semibold text-white/40">No prior sets</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-[20px_1fr_66px_50px_44px] items-center gap-2 px-2.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
          <span className="text-center">#</span>
          <span>Prev</span>
          <span className="text-center">{weightUnitLabel}</span>
          <span className="text-center">Reps</span>
          <span aria-hidden="true" />
        </div>

        {exercise.sets.map((set, index) => {
          const nextSet = exercise.sets[index + 1];
          const resolvedNextCompletedAt = nextSet?.completedAt || (index === exercise.sets.length - 1 ? nextExerciseCompletedAt : null);

          return (
            <SetEntryRow
              key={set.id}
              set={set}
              previous={previous}
              isPr={set.id === prSetId}
              nextSetCompletedAt={resolvedNextCompletedAt}
              onChange={(updated) => onSetChange(exercise.id, updated)}
              onRemove={exercise.sets.length > 1 ? () => onRemoveSet(exercise.id, set.id) : undefined}
            />
          );
        })}

        <button
          type="button"
          onClick={() => onAddSet(exercise.id)}
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-white/[0.12] bg-white/[0.02] text-[13px] font-semibold text-white/60 transition-colors hover:border-[#22C55E]/40 hover:text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add set
        </button>
      </div>

      {showNotes ? (
        <label className="block space-y-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">Exercise notes</span>
          <textarea
            className="min-h-[80px] w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-3 text-[14px] text-white transition-colors placeholder:text-white/30 focus:border-[#22C55E]/50 focus:outline-none"
            maxLength={2000}
            autoFocus={!exercise.notes}
            onChange={(event) => onNotesChange(exercise.id, event.currentTarget.value)}
            placeholder="Technique, pain, substitutions, cues."
            value={exercise.notes}
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-white/45 transition-colors hover:text-white"
        >
          <StickyNote className="h-3.5 w-3.5" /> Add note
        </button>
      )}

      <ExerciseHelpSheet exerciseData={sheetData} isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <ExerciseSwapSheet
        open={isSwapOpen}
        onClose={() => setIsSwapOpen(false)}
        catalog={catalog}
        currentExerciseId={exercise.selectedExerciseId}
        pending={pending}
        onSelect={(exerciseId) => {
          onSwap(exercise.id, exerciseId);
          setIsSwapOpen(false);
        }}
      />
    </section>
  );
}
