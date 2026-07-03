import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql, eq, and, max, sum, asc } from 'drizzle-orm';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { db } from '@/db/client';
import { exercises, workoutExerciseEntries, workoutSessions, setEntries } from '@/db/schema';
import { ExerciseSelector } from '@/components/progress/exercise-selector';
import { requireClerkUserId } from '@/lib/auth';
import { getOrCreateUserSettings } from '@/lib/data/settings';

interface PageProps {
  searchParams: Promise<{ exercise?: string }>;
}

export default async function ProgressPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { exercise } = await searchParams;
  const clerkUserId = await requireClerkUserId();
  
  const settings = await getOrCreateUserSettings(clerkUserId);
  const unitLabel = settings.unit; 

  // 1. Fetch Exercises Sorted by "Last Logged" (Most recent at the top)
  const dbExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      lastLogged: max(workoutSessions.startedAt),
    })
    .from(exercises)
    .leftJoin(workoutExerciseEntries, eq(workoutExerciseEntries.exerciseId, exercises.id))
    .leftJoin(
      workoutSessions,
      and(
        eq(workoutSessions.id, workoutExerciseEntries.sessionId),
        eq(workoutSessions.clerkUserId, clerkUserId)
      )
    )
    .groupBy(exercises.id, exercises.name)
    // Sort by latest session date descending. NULLS LAST pushes unused exercises to the bottom.
    .orderBy(sql`MAX(${workoutSessions.startedAt}) DESC NULLS LAST`, exercises.name);

  // Clean the array for the client component
  const exercisesForSelector = dbExercises.map((ex) => ({ id: ex.id, name: ex.name }));
  const currentExerciseName = exercise || exercisesForSelector[0]?.name || "Flat Bench Press";
  const currentExerciseObj = dbExercises.find(ex => ex.name === currentExerciseName) || dbExercises[0];

  // 2. LIVE AGGREGATION & CHART DATA
  let bestWeight = 0;
  let totalVolume = 0;
  let estimated1RM = 0;
  
  // Array to hold historical chart data
  let chartData: { date: string; weight: number }[] = [];

  if (currentExerciseObj) {
    // A. Fetch All-Time Stats
    const stats = await db
      .select({
        maxWeight: max(setEntries.weight),
        volume: sum(sql`${setEntries.weight} * ${setEntries.reps}`),
      })
      .from(workoutExerciseEntries)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
      .innerJoin(setEntries, eq(setEntries.workoutExerciseEntryId, workoutExerciseEntries.id))
      .where(
        and(
          eq(workoutSessions.clerkUserId, clerkUserId),
          eq(workoutExerciseEntries.exerciseId, currentExerciseObj.id),
          eq(setEntries.completed, true)
        )
      );

    if (stats[0]) {
      bestWeight = Number(stats[0].maxWeight) || 0;
      totalVolume = Number(stats[0].volume) || 0;
      estimated1RM = bestWeight > 0 ? Math.round(bestWeight * 1.033) : 0; 
    }

    // B. Fetch Timeline Data for the Chart (Last 7 Sessions)
    const history = await db
      .select({
        date: workoutSessions.localDate,
        maxWeight: max(setEntries.weight),
      })
      .from(workoutExerciseEntries)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
      .innerJoin(setEntries, eq(setEntries.workoutExerciseEntryId, workoutExerciseEntries.id))
      .where(
        and(
          eq(workoutSessions.clerkUserId, clerkUserId),
          eq(workoutExerciseEntries.exerciseId, currentExerciseObj.id),
          eq(setEntries.completed, true)
        )
      )
      .groupBy(workoutSessions.localDate)
      .orderBy(asc(workoutSessions.localDate))
      .limit(7);

    chartData = history.map((d) => ({
      date: d.date.slice(5), // Keep only MM-DD for clean labels
      weight: Number(d.maxWeight) || 0,
    }));
  }

  // Calculate the highest value in the chart to scale the bars dynamically
  const chartMaxWeight = Math.max(...chartData.map(d => d.weight), 1);

  // ---- presentation-only derivations (no new queries) ----
  const chartMinWeight = chartData.length > 0 ? Math.min(...chartData.map((d) => d.weight)) : 0;
  const latestWeight = chartData.at(-1)?.weight ?? 0;
  const priorWeight = chartData.length >= 2 ? chartData[chartData.length - 2].weight : null;
  const weightDelta = priorWeight !== null ? Math.round((latestWeight - priorWeight) * 10) / 10 : null;
  const isPeak = chartData.length > 0 && latestWeight > 0 && latestWeight >= chartMaxWeight;

  const CHART_W = 300;
  const CHART_H = 130;
  const CHART_TOP = 12;
  const CHART_BOTTOM = 108;
  const pointCount = chartData.length;
  const xForIndex = (i: number): number => (pointCount <= 1 ? CHART_W / 2 : 8 + (i * (CHART_W - 16)) / (pointCount - 1));
  const yForWeight = (weight: number): number => {
    if (chartMaxWeight === chartMinWeight) return (CHART_TOP + CHART_BOTTOM) / 2;
    return CHART_BOTTOM - ((weight - chartMinWeight) / (chartMaxWeight - chartMinWeight)) * (CHART_BOTTOM - CHART_TOP);
  };
  const linePath = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xForIndex(i).toFixed(1)} ${yForWeight(d.weight).toFixed(1)}`)
    .join(' ');
  const areaPath =
    pointCount > 0 ? `${linePath} L ${xForIndex(pointCount - 1).toFixed(1)} ${CHART_H} L ${xForIndex(0).toFixed(1)} ${CHART_H} Z` : '';

  return (
    <div className="space-y-6 pb-28 text-white">
      <div className="px-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-white">Progress</h1>
      </div>

      <div className="px-1">
        <ExerciseSelector exercises={exercisesForSelector} currentExercise={currentExerciseName} />
      </div>

      <Card className="rounded-[24px] border-[#22C55E]/20 bg-[#22C55E]/[0.06] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#22C55E]">Estimated 1RM</p>
            <h2 className="mt-1 truncate text-[15px] font-semibold text-white/80">{currentExerciseName}</h2>
          </div>
          {isPeak ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/[0.12] px-2.5 py-1 text-[11px] font-bold text-amber-400">
              <Trophy className="h-3.5 w-3.5" /> Peak
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-[48px] font-black leading-none tracking-tight text-white">{estimated1RM || '—'}</span>
          <span className="pb-1.5 text-[15px] font-bold uppercase text-white/50">{unitLabel}</span>
          {weightDelta !== null && weightDelta !== 0 ? (
            <span
              className={
                'mb-1.5 ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ' +
                (weightDelta > 0 ? 'bg-[#22C55E]/15 text-[#22C55E]' : 'bg-white/10 text-white/60')
              }
            >
              <TrendingUp className={'h-3.5 w-3.5' + (weightDelta > 0 ? '' : ' rotate-180')} />
              {weightDelta > 0 ? '+' : ''}
              {weightDelta} {unitLabel}
            </span>
          ) : null}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 px-1">
        <Card className="rounded-[18px] border-white/[0.08] bg-white/[0.05] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Max weight</p>
          <p className="mt-1.5 text-[28px] font-black leading-none tracking-tight text-white">
            {bestWeight}
            <span className="ml-1 text-[13px] font-bold uppercase text-white/40">{unitLabel}</span>
          </p>
        </Card>
        <Card className="rounded-[18px] border-white/[0.08] bg-white/[0.05] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">Total volume</p>
          <p className="mt-1.5 text-[28px] font-black leading-none tracking-tight text-white">
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            <span className="ml-1 text-[13px] font-bold uppercase text-white/40">{unitLabel}</span>
          </p>
        </Card>
      </div>

      <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-white/70">Max weight over time</h3>
          {chartData.length > 0 ? <span className="text-[11px] font-semibold text-white/35">{chartData.length} sessions</span> : null}
        </div>

        {chartData.length > 0 ? (
          <>
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-[130px] w-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="progressArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
              </defs>
              {areaPath ? <path d={areaPath} fill="url(#progressArea)" /> : null}
              <path d={linePath} fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {chartData.map((d, i) => (
                <circle
                  key={i}
                  cx={xForIndex(i)}
                  cy={yForWeight(d.weight)}
                  r={i === pointCount - 1 ? 4.5 : 3}
                  fill={i === pointCount - 1 ? '#22C55E' : '#0a0e1a'}
                  stroke="#22C55E"
                  strokeWidth="2"
                />
              ))}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-white/35">
              <span>{chartData[0].date}</span>
              <span>{chartData[chartData.length - 1].date}</span>
            </div>
          </>
        ) : (
          <div className="flex h-[130px] items-center justify-center rounded-[12px] border border-dashed border-white/10 bg-white/[0.02] p-4">
            <p className="text-center text-[13px] text-white/30">
              Complete a session with {currentExerciseName} to see your history chart.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
