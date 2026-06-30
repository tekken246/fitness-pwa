'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { X, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

import type { ExerciseCatalogItem } from '@/lib/types';

type ExerciseSwapSheetProps = {
  open: boolean;
  onClose: () => void;
  catalog: ExerciseCatalogItem[];
  currentExerciseId: string;
  onSelect: (exerciseId: string) => void;
  pending: boolean;
};

export function ExerciseSwapSheet({
  open,
  onClose,
  catalog,
  currentExerciseId,
  onSelect,
  pending,
}: ExerciseSwapSheetProps): ReactNode {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 60);
    return catalog
      .filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(q) ||
          exercise.category.toLowerCase().includes(q) ||
          exercise.equipment.toLowerCase().includes(q) ||
          exercise.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(q)),
      )
      .slice(0, 60);
  }, [catalog, query]);

  if (!open) {
    return null;
  }

  const content = (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="flex h-[80vh] w-full max-w-md flex-col rounded-t-[28px] border-t border-white/10 bg-[#0a0e1a] p-5 pb-[calc(16px+env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal="true"
        aria-label="Swap exercise"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-tight text-white">Swap exercise</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close swap"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-3 shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, muscle, equipment…"
            className="h-11 w-full rounded-[12px] border border-white/[0.08] bg-white/[0.03] pl-10 pr-3 text-[14px] text-white focus:border-[#22C55E]/50 focus:outline-none placeholder:text-white/30"
          />
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-[14px] text-white/45">No exercises match.</p>
          ) : (
            filtered.map((exercise) => {
              const isCurrent = exercise.id === currentExerciseId;
              return (
                <button
                  key={exercise.id}
                  type="button"
                  disabled={pending || isCurrent}
                  onClick={() => onSelect(exercise.id)}
                  className={`flex w-full items-center justify-between rounded-[12px] border p-3 text-left transition-colors ${
                    isCurrent
                      ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.06]'
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18] disabled:opacity-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-white">{exercise.name}</p>
                    <p className="truncate text-[12px] capitalize text-white/45">
                      {(exercise.primaryMuscles.length > 0 ? exercise.primaryMuscles.join(', ') : exercise.category) +
                        ' · ' +
                        (exercise.equipment ? exercise.equipment.replace('_', ' ') : 'various')}
                    </p>
                  </div>
                  {isCurrent && <span className="ml-3 shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#22C55E]">Current</span>}
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
