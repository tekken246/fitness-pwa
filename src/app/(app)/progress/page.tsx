import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql, eq, and, max, sum } from 'drizzle-orm';
import { Trophy, Calendar, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { db } from '@/db/client';
// Fixed Import: Added setEntries
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
  
  // 1. Fetch User Settings for dynamic units
  const settings = await getOrCreateUserSettings(clerkUserId);
  const unitLabel = settings.unit; 

  // 2. Fetch available system exercises
  const dbExercises = await db.select().from(exercises).orderBy(exercises.name);
  const currentExerciseName = exercise || dbExercises[0]?.name || "Flat Bench Press";

  // 3. Find exact database ID
  const currentExerciseObj = dbExercises.find(ex => ex.name === currentExerciseName) || dbExercises[0];

  // 4. LIVE AGGREGATION
  let bestWeight = 0;
  let totalVolume = 0;
  let estimated1RM = 0;

  if (currentExerciseObj) {
    const stats = await db
      .select({
        // Fixed: Pulling from setEntries
        maxWeight: max(setEntries.weight),
        volume: sum(sql`${setEntries.weight} * ${setEntries.reps}`),
      })
      .from(workoutExerciseEntries)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
      // Fixed: Join the setEntries table
      .innerJoin(setEntries, eq(setEntries.workoutExerciseEntryId, workoutExerciseEntries.id))
      .where(
        and(
          eq(workoutSessions.clerkUserId, clerkUserId),
          eq(workoutExerciseEntries.exerciseId, currentExerciseObj.id),
          eq(setEntries.completed, true) // Only count completed sets!
        )
      );

      if (stats[0]) {
        // Safely converts whether Drizzle returns a number, a string, or null
        bestWeight = Number(stats[0].maxWeight) || 0;
        totalVolume = Number(stats[0].volume) || 0;
        estimated1RM = bestWeight > 0 ? Math.round(bestWeight * 1.033) : 0; 
      }
  }

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
        <ExerciseSelector exercises={dbExercises} currentExercise={currentExerciseName} />
      </div>

      <div className="px-1 py-1 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-white tracking-tight">{currentExerciseName} Stats</h2>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 border border-[#22C55E]/30 text-[#22C55E] text-[12px] font-semibold">
          <TrendingUp className="h-3.5 w-3.5" /> Stable Trend
        </div>
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
        <h3 className="text-[13px] font-semibold text-white/70 mb-4">Performance Tracking</h3>
        <div className="flex h-[130px] w-full items-center justify-center rounded-[12px] border border-dashed border-white/10 bg-white/[0.02]">
           <p className="text-[13px] text-white/30 px-6 text-center">
             {bestWeight > 0 
                ? `You have logged data for ${currentExerciseName}. A visual chart will appear here as you log more sessions.`
                : `Complete a session with ${currentExerciseName} to see your history chart.`
             }
           </p>
        </div>
      </Card>
    </div>
  );
}