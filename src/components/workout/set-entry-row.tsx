'use client';

import type { ReactNode } from 'react';

import type { SetEntryView } from '@/lib/types';
import { cn } from '@/lib/utils';

type SetEntryRowProps = {
  set: SetEntryView;
  onChange: (set: SetEntryView) => void;
};

function parseNullableNumber(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Renders one mobile-optimized set input row. */
export function SetEntryRow({ set, onChange }: SetEntryRowProps): ReactNode {
  return (
    <div
      className={cn(
        'grid grid-cols-[2.2rem_1fr_1fr_3.2rem] items-center gap-2 rounded-2xl border border-border bg-background/45 p-2',
        set.completed && 'border-success/60 bg-success/10',
      )}
    >
      <div className="text-center text-sm font-black text-muted">{set.position}</div>
      <label className="space-y-1">
        <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">
          Weight {set.unit !== 'none' ? `(${set.unit})` : ''}
        </span>
        <input
          aria-label={`Set ${set.position} weight`}
          className="h-12 w-full rounded-xl border-border bg-card text-center text-lg font-black focus:border-primary focus:ring-primary"
          inputMode="decimal"
          min="0"
          onChange={(event) => onChange({ ...set, weight: parseNullableNumber(event.currentTarget.value) })}
          placeholder="—"
          type="number"
          value={set.weight ?? ''}
        />
      </label>
      <label className="space-y-1">
        <span className="block text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">
          Reps / {set.targetLabel}
        </span>
        <input
          aria-label={`Set ${set.position} reps`}
          className="h-12 w-full rounded-xl border-border bg-card text-center text-lg font-black focus:border-primary focus:ring-primary"
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
          'h-12 rounded-xl border border-border text-xs font-black uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary',
          set.completed ? 'bg-success text-background' : 'bg-card text-muted',
        )}
        onClick={() => onChange({ ...set, completed: !set.completed })}
        type="button"
      >
        {set.completed ? 'Done' : 'Log'}
      </button>
    </div>
  );
}
