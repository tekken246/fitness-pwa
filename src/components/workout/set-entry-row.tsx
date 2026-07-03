'use client';

import type { ReactNode } from 'react';
import { Check, Timer, Trash2, Trophy } from 'lucide-react';

import type { PreviousPerformance, SetEntryView } from '@/lib/types';
import { cn } from '@/lib/utils';

type SetEntryRowProps = {
  set: SetEntryView;
  /** Last logged performance for this exercise, used for the PREV hint + one-tap prefill. */
  previous?: PreviousPerformance | null;
  /** True when this set is the exercise's best e1RM and beats prior history. */
  isPr?: boolean;
  /** Completion time of the following set, used only for the static "rested" readout. */
  nextSetCompletedAt?: string | null | Date;
  onChange: (set: SetEntryView) => void;
  onRemove?: () => void;
};

function parseNullableNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SetEntryRow({ set, previous = null, isPr = false, nextSetCompletedAt, onChange, onRemove }: SetEntryRowProps): ReactNode {
  const isWarmup = set.kind === 'warmup';

  // Tapping the check commits the set. If the athlete never touched the fields,
  // last time's numbers are filled in automatically — the one-tap fast path.
  const toggleComplete = (): void => {
    const isCompleting = !set.completed;
    if (!isCompleting) {
      onChange({ ...set, completed: false, completedAt: null });
      return;
    }
    const weight = set.weight ?? (previous ? previous.weight : null);
    const reps = set.reps ?? (previous ? previous.reps : null);
    onChange({ ...set, weight, reps, completed: true, completedAt: new Date().toISOString() });
  };

  // Static (non-ticking) readout of how long the athlete rested before the next set.
  let restedLabel: string | null = null;
  if (set.completed && set.completedAt && nextSetCompletedAt) {
    const taken = Math.max(0, Math.floor((new Date(nextSetCompletedAt).getTime() - new Date(set.completedAt).getTime()) / 1000));
    restedLabel = formatClock(taken);
  }

  const prevLabel = previous ? `${previous.weight} × ${previous.reps}` : '—';

  return (
    <div
      className={cn(
        'rounded-[14px] border transition-colors duration-300',
        isWarmup
          ? 'border-amber-400/25 bg-amber-400/[0.05]'
          : set.completed
            ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.06]'
            : 'border-white/[0.08] bg-white/[0.04]',
      )}
    >
      <div className="grid grid-cols-[20px_1fr_66px_50px_44px] items-center gap-2 px-2.5 py-2">
        <div className="text-center text-[13px] font-bold text-white/40">{isWarmup ? 'W' : set.position}</div>

        <div className="min-w-0 truncate text-[11px] font-medium text-white/35" title={prevLabel}>
          {prevLabel}
        </div>

        <input
          aria-label={`Set ${set.position} weight`}
          className="h-11 w-full rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-center text-[16px] font-bold text-white transition-colors placeholder:text-white/25 focus:border-[#22C55E]/60 focus:outline-none"
          inputMode="decimal"
          type="number"
          min="0"
          placeholder={previous ? String(previous.weight) : '—'}
          value={set.weight ?? ''}
          onChange={(event) => {
            const parsed = parseNullableNumber(event.currentTarget.value);
            onChange({ ...set, weight: parsed === null ? null : Math.max(0, Math.min(2000, Math.round(parsed * 100) / 100)) });
          }}
        />

        <input
          aria-label={`Set ${set.position} reps`}
          className="h-11 w-full rounded-[10px] border border-white/[0.1] bg-white/[0.03] text-center text-[16px] font-bold text-white transition-colors placeholder:text-white/25 focus:border-[#22C55E]/60 focus:outline-none"
          inputMode="numeric"
          type="number"
          min="0"
          placeholder={previous ? String(previous.reps) : '—'}
          value={set.reps ?? ''}
          onChange={(event) => {
            const parsed = parseNullableNumber(event.currentTarget.value);
            onChange({ ...set, reps: parsed === null ? null : Math.max(0, Math.min(1000, Math.trunc(parsed))) });
          }}
        />

        <button
          type="button"
          aria-pressed={set.completed}
          aria-label={set.completed ? `Mark set ${set.position} not done` : `Complete set ${set.position}`}
          onClick={toggleComplete}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all',
            set.completed
              ? 'border-[#22C55E] bg-[#22C55E] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
              : 'border-white/20 bg-transparent text-transparent hover:border-white/40',
          )}
        >
          <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-center gap-2 px-2.5 pb-2.5">
        <button
          type="button"
          aria-pressed={isWarmup}
          onClick={() => onChange({ ...set, kind: isWarmup ? 'working' : 'warmup' })}
          className={cn(
            'h-7 rounded-[8px] border px-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors',
            isWarmup
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
              : 'border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white',
          )}
        >
          Warm-up
        </button>

        <div className="ml-auto flex items-center gap-2">
          {isPr ? (
            <span className="inline-flex items-center gap-1 rounded-[6px] bg-amber-400/[0.14] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <Trophy className="h-3 w-3" aria-hidden="true" /> PR
            </span>
          ) : null}
          {restedLabel ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-white/40">
              <Timer className="h-3 w-3" aria-hidden="true" /> <span className="font-mono text-[12px]">{restedLabel}</span>
            </span>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove set ${set.position}`}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-white/35 transition-colors hover:border-red-500/30 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
