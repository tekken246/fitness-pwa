'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

type PlateCalculatorProps = {
  weight: number | null;
  unit: 'lb' | 'kg' | 'none';
  open: boolean;
  onClose: () => void;
};

const PLATES: Record<'kg' | 'lb', number[]> = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
};

const DEFAULT_BAR: Record<'kg' | 'lb', number> = { kg: 20, lb: 45 };

/** Greedy per-side plate breakdown. Returns the closest fit with standard plates. */
function computePlates(total: number, bar: number, unit: 'kg' | 'lb'): { plate: number; count: number }[] {
  let perSide = (total - bar) / 2;
  if (perSide <= 0) {
    return [];
  }

  const result: { plate: number; count: number }[] = [];
  for (const plate of PLATES[unit]) {
    const count = Math.floor(perSide / plate + 1e-9);
    if (count > 0) {
      result.push({ plate, count });
      perSide -= count * plate;
    }
  }
  return result;
}

export function PlateCalculator({ weight, unit, open, onClose }: PlateCalculatorProps): ReactNode {
  const resolvedUnit: 'kg' | 'lb' = unit === 'lb' ? 'lb' : 'kg';
  const barKey = `fittrack:barWeight:${resolvedUnit}`;
  const [bar, setBar] = useState<number>(DEFAULT_BAR[resolvedUnit]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(barKey);
      const parsed = raw ? Number(raw) : NaN;
      setBar(Number.isFinite(parsed) ? parsed : DEFAULT_BAR[resolvedUnit]);
    } catch {
      setBar(DEFAULT_BAR[resolvedUnit]);
    }
  }, [barKey, resolvedUnit]);

  if (!open || !mounted) {
    return null;
  }

  const total = weight ?? 0;
  const plates = computePlates(total, bar, resolvedUnit);
  const platedPerSide = plates.reduce((sum, p) => sum + p.plate * p.count, 0);
  const leftover = (total - bar) / 2 - platedPerSide;
  const step = resolvedUnit === 'kg' ? 2.5 : 5;

  const updateBar = (value: number): void => {
    const next = Math.max(0, Math.round(value * 100) / 100);
    setBar(next);
    try {
      window.localStorage.setItem(barKey, String(next));
    } catch {
      // ignore
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="w-full max-w-md rounded-t-[28px] border-t border-white/10 bg-[#0a0e1a] p-5 pb-[calc(24px+env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal="true"
        aria-label="Plate calculator"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold tracking-tight text-white">Plate calculator</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plate calculator"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-white/50 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-3">
          <span className="text-[13px] text-white/60">Bar weight ({resolvedUnit})</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => updateBar(bar - step)} className="h-8 w-8 rounded-[8px] bg-white/[0.06] text-[16px] font-bold text-white" aria-label="Decrease bar weight">−</button>
            <span className="w-12 text-center text-[15px] font-bold text-white">{bar}</span>
            <button type="button" onClick={() => updateBar(bar + step)} className="h-8 w-8 rounded-[8px] bg-white/[0.06] text-[16px] font-bold text-white" aria-label="Increase bar weight">+</button>
          </div>
        </div>

        {total <= bar ? (
          <p className="py-6 text-center text-[14px] text-white/50">Enter a weight above the bar weight to see plates.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[13px] text-white/60">
              Per side for <span className="font-bold text-white">{total} {resolvedUnit}</span>:
            </p>
            <div className="flex flex-wrap gap-2">
              {plates.map((p) => (
                <span key={p.plate} className="rounded-[10px] border border-[#22C55E]/30 bg-[#22C55E]/[0.06] px-3 py-2 text-[14px] font-bold text-[#22C55E]">
                  {p.count} × {p.plate}
                </span>
              ))}
            </div>
            {leftover > 0.01 && (
              <p className="text-[12px] text-amber-400">
                Closest fit; {leftover.toFixed(2)} {resolvedUnit} per side not platable with standard plates.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
