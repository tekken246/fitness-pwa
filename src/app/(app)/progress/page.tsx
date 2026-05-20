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

  return (
    <div className="space-y-6 pb-28 text-white">
      <div className="px-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-white">Progress</h1>
      </div>

      <Card className="rounded-[20px] border-white/10 bg-white/[0.07] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22C55E]">Analytics Engine</p>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight text-white">Volume Metrics</h2>
            <p className="text-[13px] font-medium text-white/60 mt-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Live metrics synchronization active
            </p>
          </div>
        </div>
      </Card>

      <div className="px-1">
        <ExerciseSelector exercises={exercisesForSelector} currentExercise={currentExerciseName} />
      </div>

      <div className="px-1 py-1 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-white tracking-tight">{currentExerciseName} Stats</h2>
        {chartData.length >= 2 && chartData[chartData.length - 1].weight >= chartData[chartData.length - 2].weight ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 border border-[#22C55E]/30 text-[#22C55E] text-[12px] font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> Improving Trend
          </div>
        ) : chartData.length > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 border border-white/20 text-white/70 text-[12px] font-semibold">
            Stable Trend
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2 px-1">
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-white/[0.08] bg-white/[0.05] p-4 text-center">
          <p className="text-[18px] font-bold text-white">
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
            <span className="text-[11px] text-white/50 ml-0.5 uppercase">{unitLabel}</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Est. Vol</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-white/[0.08] bg-white/[0.05] p-4 text-center">
          <p className="text-[18px] font-bold text-white">
            {bestWeight}
            <span className="text-[11px] text-white/50 ml-0.5 uppercase">{unitLabel}</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Max Wt</p>
        </Card>

        <Card className="flex flex-col items-center justify-center rounded-[16px] border-[#22C55E]/20 bg-[#22C55E]/5 p-4 text-center">
          <p className="text-[18px] font-bold text-[#22C55E]">
            {estimated1RM}
            <span className="text-[11px] text-[#22C55E]/60 ml-0.5 uppercase">{unitLabel}</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#22C55E]/60">E1RM</p>
        </Card>
      </div>

      <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="text-[13px] font-semibold text-white/70 mb-4">Max Weight Over Time</h3>
        
        {/* NATIVE TAILWIND BAR CHART */}
        <div className="flex h-[140px] w-full items-end justify-between gap-2 rounded-[12px] border border-dashed border-white/10 bg-white/[0.02] p-4 pt-8">
           {chartData.length > 0 ? (
             chartData.map((dataPoint, index) => {
               // Calculate height percentage relative to the maximum weight in the chart (minimum height 10%)
               const heightPercentage = Math.max((dataPoint.weight / chartMaxWeight) * 100, 10);
               
               return (
                 <div key={index} className="flex flex-1 flex-col items-center justify-end h-full gap-2 group">
                   <div className="relative w-full flex justify-center h-full items-end">
                     {/* Hover Tooltip */}
                     <span className="absolute -top-6 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                       {dataPoint.weight}
                     </span>
                     {/* The Bar */}
                     <div 
                       className="w-full max-w-[28px] bg-[#22C55E] rounded-t-sm hover:bg-[#22C55E]/80 transition-all duration-300"
                       style={{ height: `${heightPercentage}%` }}
                     />
                   </div>
                   <span className="text-[10px] font-semibold text-white/40 tracking-tighter">{dataPoint.date}</span>
                 </div>
               );
             })
           ) : (
             <div className="flex w-full items-center justify-center h-full pb-4">
               <p className="text-[13px] text-white/30 text-center">
                 Complete a session with {currentExerciseName} to see your history chart.
               </p>
             </div>
           )}
        </div>
      </Card>
    </div>
  );
}