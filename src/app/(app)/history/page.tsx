import Link from 'next/link';
import type { ReactNode } from 'react';
import { Search, ChevronRight, Activity, Clock, Dumbbell, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { getRecentWorkoutSessions } from '@/lib/data/workout-sessions';
import { requireClerkUserId } from '@/lib/auth';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { tab = 'sessions' } = await searchParams;
  const clerkUserId = await requireClerkUserId();
  
  // In a real app, you would fetch exercises from DB here.
  const recentSessions = await getRecentWorkoutSessions(clerkUserId);
  
  // Generate dummy heatmap data for the visual (last 28 days)
  const heatmapDays = Array.from({ length: 28 }).map((_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    intensity: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0, // 0-3 scale
  })).reverse();

  const muscleFilters = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs'];

  return (
    <div className="space-y-6 pb-28 text-white">
      
      {/* Page Header & Segmented Tabs */}
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

      {/* =========================================
          TAB: SESSIONS
          ========================================= */}
      {tab === 'sessions' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Calendar Heatmap (Level 0) */}
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

          {/* Session Cards (Level 1) */}
          <div className="space-y-3">
            {recentSessions.map((session, index) => (
              <Link key={session.id} href={`/sessions/${session.id}`} className="block">
                <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.05] p-4 hover:border-white/[0.15] hover:bg-white/[0.07] transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[17px] font-semibold tracking-tight text-white">{session.muscleGroup}</h3>
                      <p className="text-[13px] font-medium text-white/45 mt-0.5">{session.localDate}</p>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/30">
                      {index === 0 ? '2 days ago' : `${index + 3} days ago`}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="mt-4 flex items-center gap-4 text-[13px] text-white/60">
                    <div className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4 text-white/40" /> 6 exercises</div>
                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-white/40" /> 52 min</div>
                    <div className="flex items-center gap-1.5"><Activity className="h-4 w-4 text-white/40" /> 4.2k kg</div>
                  </div>

                  {/* Optional PR Badge */}
                  {index === 1 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#22C55E] border border-[#22C55E]/20">
                      <Trophy className="h-3 w-3" /> New PR: Flat Bench Press
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* =========================================
          TAB: EXERCISES
          ========================================= */}
      {tab === 'exercises' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search history..."
              className="h-[52px] w-full rounded-[16px] border border-white/5 bg-white/[0.03] pl-12 pr-4 text-[15px] text-white focus:border-[#22C55E]/50 focus:outline-none transition-colors placeholder:text-white/30"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {muscleFilters.map((filter, i) => (
              <button
                key={filter}
                className={`snap-start shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all border ${
                  i === 0
                    ? 'bg-[#22C55E] text-black border-[#22C55E]'
                    : 'bg-white/[0.03] text-white/60 border-white/[0.08] hover:bg-white/[0.08]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Exercise List */}
          <div className="space-y-2 mt-2">
            {['Flat Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Tricep Pushdown'].map((name) => (
              <Link href={`/exercises/dummy-id`} key={name} className="block">
                <Card className="flex items-center justify-between rounded-[16px] border-white/[0.06] bg-white/[0.04] p-3 hover:border-[#22C55E]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] border border-white/[0.08]">
                      <Dumbbell className="h-5 w-5 text-white/30" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{name}</h3>
                      <p className="text-[12px] text-white/45 mt-0.5">Last: May 18 · Best: 200 lb</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/30" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}