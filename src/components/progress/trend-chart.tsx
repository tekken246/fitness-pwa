'use client';

import type { ReactNode } from 'react';

import type { ExerciseProgressPoint } from '@/lib/types';

type TrendChartProps = {
  points: ExerciseProgressPoint[];
};

function normalize(value: number, min: number, max: number): number {
  if (max === min) {
    return 50;
  }

  return 100 - ((value - min) / (max - min)) * 80 - 10;
}

/** Renders a lightweight SVG trend chart for mobile analytics. */
export function TrendChart({ points }: TrendChartProps): ReactNode {
  if (points.length === 0) {
    return <div className="rounded-2xl border border-border bg-background/45 p-4 text-sm text-muted">No completed sets yet.</div>;
  }

  const values = points.map((point) => point.estimatedOneRepMax || point.volume);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 320;
  const height = 140;
  const step = points.length === 1 ? 0 : width / (points.length - 1);
  const path = values
    .map((value, index) => `${index === 0 ? 'M' : 'L'} ${index * step} ${normalize(value, min, max)}`)
    .join(' ');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/45 p-3">
      <svg aria-label="Exercise strength trend" className="h-36 w-full" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
        <path d={path} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
        {values.map((value, index) => (
          <circle cx={index * step} cy={normalize(value, min, max)} fill="currentColor" key={`${points[index]?.localDate}-${value}`} r="4" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[0.7rem] font-bold text-muted">
        <span>{points[0]?.localDate}</span>
        <span>{points.at(-1)?.localDate}</span>
      </div>
    </div>
  );
}
