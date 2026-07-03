'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Check, Dumbbell, Plus, Loader2 } from 'lucide-react';

import { addExercisesToRoutineAction } from '@/lib/actions/builder-actions';
import { cn } from '@/lib/utils';

type Exercise = {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  equipment: string;
  images: string[];
};

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

// Skips rendering work for off-screen rows without pulling in a virtualization library.
const ROW_PERF_STYLE = { contentVisibility: 'auto', containIntrinsicSize: '0 68px' } as unknown as CSSProperties;

export function ExerciseSearchList({ exercises, dayId }: { exercises: Exercise[]; dayId: string }): ReactNode {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const filteredExercises = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return exercises.filter((ex) => {
      const checkMuscle = (target: string) =>
        (ex.category && ex.category.toLowerCase() === target) ||
        (ex.primaryMuscles && ex.primaryMuscles.some((m) => m.toLowerCase() === target));

      const matchesQuery =
        !lowerQuery ||
        ex.name.toLowerCase().includes(lowerQuery) ||
        (ex.category && ex.category.toLowerCase().includes(lowerQuery)) ||
        (ex.primaryMuscles && ex.primaryMuscles.some((m) => m.toLowerCase().includes(lowerQuery))) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(lowerQuery));

      let matchesFilter = true;
      if (activeFilter !== 'All') {
        const target = activeFilter.toLowerCase();
        if (target === 'arms') {
          matchesFilter = checkMuscle('biceps') || checkMuscle('triceps');
        } else if (target === 'core') {
          matchesFilter = checkMuscle('abs') || checkMuscle('core');
        } else {
          matchesFilter = checkMuscle(target);
        }
      }

      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter, exercises]);

  const allFilteredSelected = filteredExercises.length > 0 && filteredExercises.every((ex) => selected.has(ex.id));

  const toggle = (id: string): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        for (const ex of filteredExercises) next.delete(ex.id);
      } else {
        for (const ex of filteredExercises) next.add(ex.id);
      }
      return next;
    });
  };

  const handleAddSelected = async (): Promise<void> => {
    if (isPending || selected.size === 0) return;
    setIsPending(true);
    try {
      await addExercisesToRoutineAction({ dayId, exerciseIds: Array.from(selected) });
      router.push(`/workouts/${dayId}/edit`);
      router.refresh();
    } catch (error) {
      console.error('Failed to add exercises', error);
      setIsPending(false);
    }
  };

  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm font-bold text-white">Exercise library is empty</p>
        <p className="mt-2 text-xs text-white/50">Seed the database with exercises before adding them to a routine.</p>
      </div>
    );
  }

  const selectedCount = selected.size;

  return (
    <div className="flex h-full flex-col gap-3 pb-28">
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search name, muscle, or equipment"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-[14px] border border-white/[0.1] bg-white/[0.03] pl-10 pr-4 text-sm text-white transition-colors placeholder:text-white/30 focus:border-[#22C55E]/50 focus:outline-none"
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MUSCLE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-all',
                activeFilter === filter
                  ? 'border-[#22C55E] bg-[#22C55E] text-black'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white',
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        {filteredExercises.length > 0 ? (
          <button onClick={toggleSelectAll} className="shrink-0 text-[12px] font-bold text-[#22C55E] hover:opacity-80">
            {allFilteredSelected ? 'Clear' : 'Select all'}
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredExercises.length === 0 ? (
          <p className="mt-8 text-center text-sm text-white/40">No exercises match your filters.</p>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = selected.has(exercise.id);
            const thumb = exercise.images && exercise.images.length > 0 ? exercise.images[0] : null;
            const subtitle =
              exercise.primaryMuscles && exercise.primaryMuscles.length > 0
                ? exercise.primaryMuscles.join(', ')
                : exercise.category;

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => toggle(exercise.id)}
                aria-pressed={isSelected}
                style={ROW_PERF_STYLE}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[14px] border p-2 text-left transition-colors',
                  isSelected ? 'border-[#22C55E]/40 bg-[#22C55E]/[0.08]' : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.16]',
                )}
              >
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white/[0.06]">
                  <Dumbbell className="h-6 w-6 text-white/25" aria-hidden="true" />
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => e.currentTarget.remove()}
                      className="absolute inset-0 h-full w-full bg-white object-cover"
                    />
                  ) : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-white">{exercise.name}</span>
                  <span className="mt-0.5 block truncate text-[12px] capitalize text-white/45">
                    {subtitle} · {exercise.equipment ? exercise.equipment.replace(/_/g, ' ') : 'various'}
                  </span>
                </span>

                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isSelected ? 'border-[#22C55E] bg-[#22C55E] text-black' : 'border-white/20 text-transparent',
                  )}
                >
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                </span>
              </button>
            );
          })
        )}
      </div>

      {selectedCount > 0 ? (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-md px-4">
          <button
            type="button"
            onClick={handleAddSelected}
            disabled={isPending}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-[#22C55E] text-[15px] font-bold text-black shadow-[0_0_24px_rgba(34,197,94,0.35)] transition-opacity disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5" /> Add {selectedCount} exercise{selectedCount === 1 ? '' : 's'}
              </>
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}
