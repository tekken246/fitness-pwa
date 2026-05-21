'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Timer } from 'lucide-react';

import type { SetEntryView } from '@/lib/types';
import { cn } from '@/lib/utils';

type SetEntryRowProps = {
  set: SetEntryView;
  nextSetCompletedAt?: string | null | Date; // Passed down from ExerciseCard
  onChange: (set: SetEntryView) => void;
};

function parseNullableNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRestTime(diffInSeconds: number) {
  const m = Math.floor(diffInSeconds / 60);
  const s = diffInSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SetEntryRow({ set, nextSetCompletedAt, onChange }: SetEntryRowProps): ReactNode {
  const [now, setNow] = useState(Date.now());

  // Ticking rest timer logic
  useEffect(() => {
    // Don't tick if set isn't done, or if the NEXT set is already done
    if (!set.completed || !set.completedAt || nextSetCompletedAt) return;
    
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [set.completed, set.completedAt, nextSetCompletedAt]);

  let restDisplay = null;
  if (set.completed && set.completedAt) {
    const start = new Date(set.completedAt).getTime();
    // If the next set is done, lock the time to its completion date. Otherwise, use live time.
    const end = nextSetCompletedAt ? new Date(nextSetCompletedAt).getTime() : now;
    const diff = Math.max(0, Math.floor((end - start) / 1000));
    
    restDisplay = (
      <div className="flex items-center justify-end gap-1.5 px-3 pb-2 text-[11px] font-bold tracking-widest uppercase text-[#22C55E]">
        <Timer className="h-3 w-3" />
        Rest: <span className="font-mono text-[12px]">{formatRestTime(diff)}</span>
      </div>
    );
  }

  const toggleComplete = () => {
    const isCompleting = !set.completed;
    onChange({
      ...set,
      completed: isCompleting,
      // CRITICAL: Capture the exact time the user clicked "Done" to save to DB
      completedAt: isCompleting ? new Date().toISOString() : null, 
    });
  };

  return (
    <div className={cn(
      "flex flex-col rounded-[16px] border transition-colors duration-300", 
      set.completed ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.03]' : 'border-white/[0.08] bg-white/[0.04]'
    )}>
      <div className="grid grid-cols-[2.2rem_1fr_1fr_3.8rem] items-center gap-2 p-2">
        <div className="text-center text-[13px] font-bold text-white/40">{set.position}</div>
        
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 px-1">
            Weight {set.unit !== 'none' ? `(${set.unit})` : ''}
          </span>
          <input
            aria-label={`Set ${set.position} weight`}
            className="h-[44px] w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-center text-[16px] font-bold text-white focus:border-[#22C55E]/50 focus:outline-none placeholder:text-white/20 transition-colors"
            inputMode="decimal"
            min="0"
            onChange={(event) => onChange({ ...set, weight: parseNullableNumber(event.currentTarget.value) })}
            placeholder="—"
            type="number"
            value={set.weight ?? ''}
          />
        </label>

        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 px-1 truncate">
            {set.targetLabel}
          </span>
          <input
            aria-label={`Set ${set.position} reps`}
            className="h-[44px] w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-center text-[16px] font-bold text-white focus:border-[#22C55E]/50 focus:outline-none placeholder:text-white/20 transition-colors"
            inputMode="numeric"
            min="0"
            onChange={(event) => onChange({ ...set, reps: parseNullableNumber(event.currentTarget.value) })}
            placeholder="—"
            type="number"
            value={set.reps ?? ''}
          />
        </label>

        <button
          aria-pressed={set.completed}
          className={cn(
            'h-[44px] rounded-[10px] border text-[12px] font-bold uppercase tracking-wider transition-all focus:outline-none mt-[18px]',
            set.completed 
              ? 'bg-[#22C55E] text-black border-[#22C55E] shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
              : 'bg-white/[0.05] text-white/50 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
          )}
          onClick={toggleComplete}
          type="button"
        >
          {set.completed ? 'Done' : 'Log'}
        </button>
      </div>

      {/* Render the expandable rest timer underneath the row */}
      {restDisplay}
    </div>
  );
}