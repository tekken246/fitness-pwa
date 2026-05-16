'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { TrendChart } from '@/components/progress/trend-chart';
import type { ExerciseProgressSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

type ProgressDashboardProps = {
  summaries: ExerciseProgressSummary[];
};

/** Renders per-exercise strength analytics and selectable trend charts. */
export function ProgressDashboard({ summaries }: ProgressDashboardProps): ReactNode {
  const [selectedExerciseId, setSelectedExerciseId] = useState(summaries[0]?.exerciseId ?? '');
  const selected = useMemo(
    () => summaries.find((summary) => summary.exerciseId === selectedExerciseId) ?? summaries[0] ?? null,
    [selectedExerciseId, summaries],
  );

  if (!selected) {
    return <div className="rounded-3xl border border-border bg-card/80 p-5 text-sm text-muted">Complete a workout to unlock trends.</div>;
  }

  return (
    <div className="space-y-4">
      <select
        className="h-12 w-full rounded-2xl border-border bg-card font-bold focus:border-primary focus:ring-primary"
        onChange={(event) => setSelectedExerciseId(event.currentTarget.value)}
        value={selected.exerciseId}
      >
        {summaries.map((summary) => (
          <option key={summary.exerciseId} value={summary.exerciseId}>
            {summary.exerciseName}
          </option>
        ))}
      </select>

      <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-glow backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Selected exercise</p>
            <h2 className="text-2xl font-black tracking-tight">{selected.exerciseName}</h2>
          </div>
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide',
              selected.trend === 'stronger' && 'bg-success/20 text-success',
              selected.trend === 'weaker' && 'bg-danger/20 text-danger',
              selected.trend === 'neutral' && 'bg-muted/20 text-muted',
            )}
          >
            {selected.trend}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Metric label="Volume" value={selected.latest?.volume ?? 0} />
          <Metric label="Best" value={selected.latest?.bestWeight ?? 0} />
          <Metric label="e1RM" value={selected.latest?.estimatedOneRepMax ?? 0} />
        </div>

        {selected.personalRecord ? (
          <p className="mt-4 rounded-2xl bg-success/15 p-3 text-sm font-bold text-success">Personal record detected.</p>
        ) : null}

        <div className="mt-4">
          <TrendChart points={selected.points} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): ReactNode {
  return (
    <div className="rounded-2xl border border-border bg-background/45 p-3">
      <div className="text-lg font-black">{Math.round(value * 10) / 10}</div>
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</div>
    </div>
  );
}
