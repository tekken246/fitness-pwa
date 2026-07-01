'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Timer, Minus, Plus, Calculator, Trash2 } from 'lucide-react';

import type { SetEntryView } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlateCalculator } from '@/components/workout/plate-calculator';

type SetEntryRowProps = {
  set: SetEntryView;
  nextSetCompletedAt?: string | null | Date;
  restSeconds: number;
  onChange: (set: SetEntryView) => void;
  onRemove?: () => void;
};

function parseNullableNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function weightStep(unit: SetEntryView['unit']): number {
  if (unit === 'kg') return 2.5;
  if (unit === 'lb') return 5;
  return 1;
}

export function SetEntryRow({ set, nextSetCompletedAt, restSeconds, onChange, onRemove }: SetEntryRowProps): ReactNode {
  const [now, setNow] = useState(Date.now());
  const [showPlates, setShowPlates] = useState(false);
  const vibratedRef = useRef(false);

  const isLiveRest = set.completed && !!set.completedAt && !nextSetCompletedAt;

  // Ticking rest timer: only while this set is the most recently completed one.
  useEffect(() => {
    if (!isLiveRest) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLiveRest]);

  const liveElapsed = isLiveRest && set.completedAt ? Math.floor((now - new Date(set.completedAt).getTime()) / 1000) : null;

  // Buzz once when the rest target is reached.
  useEffect(() => {
    if (liveElapsed === null) {
      vibratedRef.current = false;
      return;
    }
    if (liveElapsed >= restSeconds && !vibratedRef.current) {
      vibratedRef.current = true;
      try {
        navigator.vibrate?.(200);
      } catch {
        // vibration unsupported
      }
    }
  }, [liveElapsed, restSeconds]);

  let restDisplay: ReactNode = null;
  if (set.completed && set.completedAt) {
    if (nextSetCompletedAt) {
      const taken = Math.max(0, Math.floor((new Date(nextSetCompletedAt).getTime() - new Date(set.completedAt).getTime()) / 1000));
      restDisplay = (
        <div className="flex items-center justify-end gap-1.5 px-3 pb-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
          <Timer className="h-3 w-3" /> Rest <span className="font-mono text-[12px]">{formatClock(taken)}</span>
        </div>
      );
    } else if (liveElapsed !== null) {
      const remaining = restSeconds - liveElapsed;
      restDisplay = (
        <div className={cn('flex items-center justify-end gap-1.5 px-3 pb-2 text-[11px] font-bold uppercase tracking-widest', remaining > 0 ? 'text-[#22C55E]' : 'text-amber-400')}>
          <Timer className="h-3 w-3" />
          {remaining > 0 ? <>Rest <span className="font-mono text-[12px]">{formatClock(remaining)}</span> left</> : <>Rest done · <span className="font-mono text-[12px]">{formatClock(liveElapsed)}</span></>}
        </div>
      );
    }
  }

  const toggleComplete = () => {
    const isCompleting = !set.completed;
    onChange({ ...set, completed: isCompleting, completedAt: isCompleting ? new Date().toISOString() : null });
  };

  const adjustWeight = (delta: number) => {
    const base = set.weight ?? 0;
    const next = Math.max(0, Math.min(2000, Math.round((base + delta) * 100) / 100));
    onChange({ ...set, weight: next });
  };

  const isWarmup = set.kind === 'warmup';

  return (
    <div
      className={cn(
        'flex flex-col rounded-[16px] border transition-colors duration-300',
        isWarmup
          ? 'border-amber-400/25 bg-amber-400/[0.03]'
          : set.completed
            ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.03]'
            : 'border-white/[0.08] bg-white/[0.04]',
      )}
    >
      <div className="grid grid-cols-[2.2rem_1fr_1fr_3.8rem] items-center gap-2 p-2">
        <div className="text-center text-[13px] font-bold text-white/40">{isWarmup ? 'W' : set.position}</div>

        <label className="space-y-1">
          <span className="block px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
            Weight {set.unit !== 'none' ? `(${set.unit})` : ''}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => adjustWeight(-weightStep(set.unit))}
              aria-label={`Decrease set ${set.position} weight`}
              className="flex h-[44px] w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              aria-label={`Set ${set.position} weight`}
              className="h-[44px] w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-center text-[16px] font-bold text-white focus:border-[#22C55E]/50 focus:outline-none placeholder:text-white/20 transition-colors"
              inputMode="decimal"
              min="0"
              onChange={(event) => { const parsed = parseNullableNumber(event.currentTarget.value); onChange({ ...set, weight: parsed === null ? null : Math.max(0, Math.min(2000, Math.round(parsed * 100) / 100)) }); }}
              placeholder="—"
              type="number"
              value={set.weight ?? ''}
            />
            <button
              type="button"
              onClick={() => adjustWeight(weightStep(set.unit))}
              aria-label={`Increase set ${set.position} weight`}
              className="flex h-[44px] w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </label>

        <label className="space-y-1">
          <span className="block truncate px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">{set.targetLabel}</span>
          <input
            aria-label={`Set ${set.position} reps`}
            className="h-[44px] w-full rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-center text-[16px] font-bold text-white focus:border-[#22C55E]/50 focus:outline-none placeholder:text-white/20 transition-colors"
            inputMode="numeric"
            min="0"
            onChange={(event) => { const parsed = parseNullableNumber(event.currentTarget.value); onChange({ ...set, reps: parsed === null ? null : Math.max(0, Math.min(1000, Math.trunc(parsed))) }); }}
            placeholder="—"
            type="number"
            value={set.reps ?? ''}
          />
        </label>

        <button
          aria-pressed={set.completed}
          className={cn(
            'mt-[18px] h-[44px] rounded-[10px] border text-[12px] font-bold uppercase tracking-wider transition-all focus:outline-none',
            set.completed
              ? 'border-[#22C55E] bg-[#22C55E] text-black shadow-[0_0_15px_rgba(34,197,94,0.15)]'
              : 'border-white/[0.08] bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white',
          )}
          onClick={toggleComplete}
          type="button"
        >
          {set.completed ? 'Done' : 'Log'}
        </button>
      </div>

      {/* Secondary controls: warmup, RPE, plates, remove */}
      <div className="flex items-center gap-2 px-2 pb-2">
        <button
          type="button"
          onClick={() => onChange({ ...set, kind: isWarmup ? 'working' : 'warmup' })}
          aria-pressed={isWarmup}
          className={cn(
            'h-8 rounded-[8px] border px-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors',
            isWarmup ? 'border-amber-400/40 bg-amber-400/10 text-amber-400' : 'border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white',
          )}
        >
          Warm-up
        </button>

        <label className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">RPE</span>
          <input
            aria-label={`Set ${set.position} RPE`}
            className="h-8 w-12 rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-center text-[13px] font-bold text-white focus:border-[#22C55E]/50 focus:outline-none placeholder:text-white/20"
            inputMode="decimal"
            min="0"
            max="10"
            step="0.5"
            placeholder="—"
            type="number"
            value={set.rpe ?? ''}
            onChange={(event) => {
              const value = parseNullableNumber(event.currentTarget.value);
              onChange({ ...set, rpe: value === null ? null : Math.max(0, Math.min(10, value)) });
            }}
          />
        </label>

        {set.unit !== 'none' && (
          <button
            type="button"
            onClick={() => setShowPlates(true)}
            aria-label={`Plate calculator for set ${set.position}`}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white"
          >
            <Calculator className="h-4 w-4" />
          </button>
        )}

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove set ${set.position}`}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-white/35 hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {restDisplay}

      <PlateCalculator weight={set.weight} unit={set.unit} open={showPlates} onClose={() => setShowPlates(false)} />
    </div>
  );
}
