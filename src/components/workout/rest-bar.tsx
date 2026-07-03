'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Timer, Minus, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';

type RestBarProps = {
  /** ISO timestamp of the most recently completed set; rest is measured from here. */
  startedAtIso: string;
  restSeconds: number;
  onSkip: () => void;
  onAdjust: (deltaSeconds: number) => void;
};

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Floating rest countdown shown while the athlete rests between sets.
 * It is the single owner of the live timer + completion haptic, so set rows
 * stay purely presentational and no duplicate intervals can run at once.
 */
export function RestBar({ startedAtIso, restSeconds, onSkip, onAdjust }: RestBarProps): ReactNode {
  const [now, setNow] = useState<number>(() => Date.now());
  const vibratedRef = useRef(false);

  useEffect(() => {
    // A new rest period (or an adjusted duration) resets the haptic latch.
    vibratedRef.current = false;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startedAtIso, restSeconds]);

  const elapsed = Math.max(0, Math.floor((now - new Date(startedAtIso).getTime()) / 1000));
  const remaining = restSeconds - elapsed;
  const done = remaining <= 0;
  const progress = Math.min(100, Math.max(0, (elapsed / Math.max(1, restSeconds)) * 100));

  useEffect(() => {
    if (done && !vibratedRef.current) {
      vibratedRef.current = true;
      try {
        navigator.vibrate?.(200);
      } catch {
        // vibration unsupported — safe to ignore
      }
    }
  }, [done]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[16px] border px-3 py-2.5 shadow-sm backdrop-blur-[20px] transition-colors',
        done ? 'border-amber-400/40 bg-amber-400/[0.12]' : 'border-[#22C55E]/40 bg-[#22C55E]/[0.12]',
      )}
    >
      <Timer className={cn('h-4 w-4 shrink-0', done ? 'text-amber-400' : 'text-[#22C55E]')} aria-hidden="true" />
      <div className="flex-1">
        <div className="h-[5px] overflow-hidden rounded-full bg-white/[0.14]">
          <div
            className={cn('h-full rounded-full transition-[width] duration-500 ease-linear', done ? 'bg-amber-400' : 'bg-[#22C55E]')}
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>
      </div>
      <span className="w-11 text-center font-mono text-[14px] font-bold text-white" aria-live="polite">
        {done ? 'Go' : formatClock(remaining)}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAdjust(-15)}
          aria-label="Reduce rest by 15 seconds"
          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white/10 text-white/70 transition-colors hover:text-white"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onAdjust(15)}
          aria-label="Add 15 seconds of rest"
          className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white/10 text-white/70 transition-colors hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-[8px] px-2 text-[12px] font-bold uppercase tracking-wider text-white/70 transition-colors hover:text-white"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
