import Link from 'next/link';
import type { ReactNode } from 'react';
import { desc, eq } from 'drizzle-orm';
import { Search, ChevronRight, Activity, Clock, Dumbbell, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { db } from '@/db/client';
import { workoutSessions, workoutTemplateDays, workoutExerciseEntries, exercises } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { tab = 'sessions' } = await searchParams;
  const clerkUserId = await requireClerkUserId();
  
  // 1. Fetch live sessions
  const realSessions = await db
    .select({
      id: workoutSessions.id,
      status: workoutSessions.status,
      localDate: workoutSessions.localDate,
      muscleGroup: workoutTemplateDays.muscleGroup,
      startedAt: workoutSessions.startedAt,
    })
    .from(workoutSessions)
    .innerJoin(workoutTemplateDays, eq(workoutTemplateDays.id, workoutSessions.templateDayId))
    .where(eq(workoutSessions.clerkUserId, clerkUserId))
    .orderBy(desc(workoutSessions.startedAt));

  // 2. Fetch distinct logged exercises (Fixing the hardcoded list!)
  const loggedExercises = await db
    .selectDistinct({
      id: exercises.id,
      name: exercises.name,
    })
    .from(workoutExerciseEntries)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .innerJoin(exercises, eq(exercises.id, workoutExerciseEntries.exerciseId))
    .where(eq(workoutSessions.clerkUserId, clerkUserId))
    .limit(20);

  const heatmapDays = Array.from({ length: 28 }).map((_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    intensity: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0,
  })).reverse();

  const muscleFilters = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs'];

  return (
    <div className="space-y-6 pb-28 text-white">
      
      <div className="space-y-5 px-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-white">History</h1>
        <div className="flex h-[40px] w-full items-center rounded-[20px] bg-white/[0.03] p-1 border border-white/[0.05]">
          <Link 
            href="/history?tab=sessions" 
            className={`flex h-full flex-1 items-center justify-center rounded-[16px] text-[13px] font-semibold transition-all ${
              tab === 'sessions' ? 'bg-[#22C55E] text-black shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            Sessions
          </Link>
          <Link 
            href="/history?tab=exercises" 
            className={`flex h-full flex-1 items-center justify-center rounded-[16px] text-[13px] font-semibold transition-all ${
              tab === 'exercises' ? 'bg-[#22C55E] text-black shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            Exercises
          </Link>
        </div>
      </div>

      {tab === 'sessions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="px-1 space-y-2">
            <h3 className="text-[13px] font-semibold text-white/70">Activity (Last 4 Weeks)</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="grid grid-rows-4 grid-flow-col gap-1.5">
                {heatmapDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={`h-[14px] w-[14px] rounded-[3px] transition-colors ${
                      day.intensity === 0 ? 'bg-white/[0.04]' :
                      day.intensity === 1 ? 'bg-[#22C55E]/30' :
                      day.intensity === 2 ? 'bg-[#22C55E]/60' :
                      'bg-[#22C55E]'
                    } ${i === 27 ? 'border border-white/50' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {realSessions.length === 0 ? (
              <div className="text-center py-12 text-white/45 text-[14px]">
                No workout logs found. Start a workout on the dashboard to see history!
              </div>
            ) : (
              realSessions.map((session, index) => (
                <Link key={session.id} href={`/sessions/${session.id}`} className="block">
                  <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.05] p-4 hover:border-white/[0.15] hover:bg-white/[0.07] transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[17px] font-semibold tracking-tight text-white">{session.muscleGroup}</h3>
                        <p className="text-[13px] font-medium text-white/45 mt-0.5">{session.localDate}</p>
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#22C55E]">
                        {session.status}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'exercises' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search history..."
              className="h-[52px] w-full rounded-[16px] border border-white/5 bg-white/[0.03] pl-12 pr-4 text-[15px] text-white focus:border-[#22C55E]/50 focus:outline-none transition-colors placeholder:text-white/30"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {muscleFilters.map((filter, i) => (
              <button
                key={filter}
                className={`snap-start shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all border ${
                  i === 0 ? 'bg-[#22C55E] text-black border-[#22C55E]' : 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-2 mt-2">
            {loggedExercises.length === 0 ? (
              <div className="text-center py-10 text-white/45 text-[14px]">
                No exercises logged yet.
              </div>
            ) : (
              loggedExercises.map((ex) => (
                <Link href={`/progress?exercise=${encodeURIComponent(ex.name)}`} key={ex.id} className="block">
                  <Card className="flex items-center justify-between rounded-[16px] border-white/[0.06] bg-white/[0.04] p-3 hover:border-[#22C55E]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] border border-white/[0.08]">
                        <Dumbbell className="h-5 w-5 text-white/30" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-semibold text-white">{ex.name}</h3>
                        <p className="text-[12px] text-white/45 mt-0.5">Tap to view metrics & trends</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/30" />
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}