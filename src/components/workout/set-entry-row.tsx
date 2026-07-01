'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Timer, Trash2 } from 'lucide-react';

import type { SetEntryView } from '@/lib/types';
import { cn } from '@/lib/utils';

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

export function SetEntryRow({ set, nextSetCompletedAt, restSeconds, onChange, onRemove }: SetEntryRowProps): ReactNode {
  const [now, setNow] = useState(Date.now());
  const vibratedRef = useRef(false);

  const isLiveRest = set.completed && !!set.completedAt && !nextSetCompletedAt;

  useEffect(() => {
    if (!isLiveRest) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLiveRest]);

  const liveElapsed = isLiveRest && set.completedAt ? Math.floor((now - new Date(set.completedAt).getTime()) / 1000) : null;

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
        <div className="flex items-center justify-end gap-1.5 px-1 pb-1 text-[11px] font-bold uppercase tracking-widest text-white/40">
          <Timer className="h-3 w-3" /> Rest <span className="font-mono text-[12px]">{formatClock(taken)}</span>
        </div>
      );
    } else if (liveElapsed !== null) {
      const remaining = restSeconds - liveElapsed;
      restDisplay = (
        <div className={cn('flex items-center justify-end gap-1.5 px-1 pb-1 text-[11px] font-bold uppercase tracking-widest', remaining > 0 ? 'text-[#22C55E]' : 'text-amber-400')}>
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

  const isWarmup = set.kind === 'warmup';

  return (
    <div
      className={cn(
        'rounded-[16px] border transition-colors duration-300',
        isWarmup
          ? 'border-amber-400/25 bg-amber-400/[0.04]'
          : set.completed
            ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.04]'
            : 'border-white/[0.08] bg-white/[0.04]',
      )}
    >
      {/* Only two entries: total weight (bar + plates) and reps. */}
      <div className="grid grid-cols-[2rem_1fr_1fr_4rem] items-end gap-2 p-2.5">
        <div className="pb-3 text-center text-[13px] font-bold text-white/40">{isWarmup ? 'W' : set.position}</div>

        <label className="space-y-1">
          <span className="block px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
            Weight {set.unit !== 'none' ? `(${set.unit})` : ''}
          </span>
          <input
            aria-label={`Set ${set.position} weight`}
            className="h-[46px] w-full rounded-[12px] border border-white/[0.1] bg-white/[0.03] text-center text-[17px] font-bold text-white focus:border-[#22C55E]/60 focus:outline-none placeholder:text-white/20 transition-colors"
            inputMode="decimal"
            type="number"
            min="0"
            placeholder="—"
            value={set.weight ?? ''}
            onChange={(event) => {
              const parsed = parseNullableNumber(event.currentTarget.value);
              onChange({ ...set, weight: parsed === null ? null : Math.max(0, Math.min(2000, Math.round(parsed * 100) / 100)) });
            }}
          />
        </label>

        <label className="space-y-1">
          <span className="block truncate px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40">
            Reps{set.targetLabel && set.targetLabel !== '—' ? ` (${set.targetLabel})` : ''}
          </span>
          <input
            aria-label={`Set ${set.position} reps`}
            className="h-[46px] w-full rounded-[12px] border border-white/[0.1] bg-white/[0.03] text-center text-[17px] font-bold text-white focus:border-[#22C55E]/60 focus:outline-none placeholder:text-white/20 transition-colors"
            inputMode="numeric"
            type="number"
            min="0"
            placeholder="—"
            value={set.reps ?? ''}
            onChange={(event) => {
              const parsed = parseNullableNumber(event.currentTarget.value);
              onChange({ ...set, reps: parsed === null ? null : Math.max(0, Math.min(1000, Math.trunc(parsed))) });
            }}
          />
        </label>

        <button
          type="button"
          aria-pressed={set.completed}
          onClick={toggleComplete}
          className={cn(
            'h-[46px] rounded-[12px] border text-[12px] font-bold uppercase tracking-wider transition-all',
            set.completed
              ? 'border-[#22C55E] bg-[#22C55E] text-black shadow-[0_0_15px_rgba(34,197,94,0.15)]'
              : 'border-white/[0.1] bg-white/[0.05] text-white/50 hover:bg-white/[0.08] hover:text-white',
          )}
        >
          {set.completed ? 'Done' : 'Log'}
        </button>
      </div>

      {/* Kept: warm-up toggle + per-set remove. (RPE, steppers, plate calculator removed.) */}
      <div className="flex items-center gap-2 px-2.5 pb-2.5">
        <button
          type="button"
          aria-pressed={isWarmup}
          onClick={() => onChange({ ...set, kind: isWarmup ? 'working' : 'warmup' })}
          className={cn(
            'h-7 rounded-[8px] border px-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors',
            isWarmup ? 'border-amber-400/40 bg-amber-400/10 text-amber-400' : 'border-white/[0.08] bg-white/[0.03] text-white/45 hover:text-white',
          )}
        >
          Warm-up
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove set ${set.position}`}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-white/35 hover:border-red-500/30 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {restDisplay}
    </div>
  );
}
