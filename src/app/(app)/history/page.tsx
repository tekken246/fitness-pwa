import Link from 'next/link';
import type { ReactNode } from 'react';
import { desc, eq, sql } from 'drizzle-orm';
import { Search, ChevronRight, Activity, Clock, Dumbbell, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { db } from '@/db/client';
import { workoutSessions, workoutTemplateDays, workoutExerciseEntries, exercises } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';
import { getOrCreateUserSettings } from '@/lib/data/settings';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { tab = 'sessions' } = await searchParams;
  const clerkUserId = await requireClerkUserId();
  
  // Fetch user settings to ensure timezone accuracy for the calendar
  const settings = await getOrCreateUserSettings(clerkUserId);
  
  // 1. Fetch live sessions for the list
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

  // 2. Fetch distinct logged exercises for the Exercises tab
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

  // 3. LIVE HEATMAP DATA: Count workouts grouped by day
  const activityQuery = await db
    .select({
      localDate: workoutSessions.localDate,
      count: sql<number>`count(${workoutSessions.id})`
    })
    .from(workoutSessions)
    .where(eq(workoutSessions.clerkUserId, clerkUserId))
    .groupBy(workoutSessions.localDate);

  // Get today's day of week securely in user's timezone
  const now = new Date();
  const formatterEn = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    weekday: 'short',
  });
  const todayStr = formatterEn.format(now);
  
  // Map to align Monday as 0, Sunday as 6
  const daysMap: Record<string, number> = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
  const adjustedDay = daysMap[todayStr] ?? 0;

  // Generate 28 days perfectly aligned to Mon-Sun rows ending on the current week's Sunday
  const heatmapDays = Array.from({ length: 28 }).map((_, i) => {
    // Math to ensure the first square is ALWAYS exactly 4 Mondays ago.
    const daysAgo = (21 + adjustedDay) - i;
    const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Format the date securely matching the database format (YYYY-MM-DD)
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: settings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateStr = formatter.format(d);
    
    // Check if we have workout data for this day
    const dayData = activityQuery.find(a => a.localDate === dateStr);
    let intensity = 0;
    
    if (dayData) {
      // 1 workout = Medium Green (Intensity 2). Multiple workouts = Bright Green (Intensity 3).
      intensity = Math.min(Number(dayData.count) + 1, 3);
    }
    
    return { 
      date: dateStr, 
      intensity, 
      isFuture: daysAgo < 0, 
      isToday: daysAgo === 0 
    };
  });

  const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
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
          
          {/* =========================================
              NEW: HORIZONTAL CALENDAR HEATMAP 
              ========================================= */}
          <div className="px-1 space-y-3">
            <h3 className="text-[13px] font-semibold text-white/70">Activity (Last 4 Weeks)</h3>
            
            <div className="w-full">
              {/* Day Headers (M T W T F S S) */}
              <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                {weekDayLabels.map((label, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-white/40">
                    {label}
                  </div>
                ))}
              </div>
              
              {/* Grid Populated Horizontally */}
              <div className="grid grid-cols-7 gap-1.5">
                {heatmapDays.map((day, i) => (
                  <div 
                    key={i} 
                    title={day.isFuture ? '' : day.intensity > 0 ? `Workout logged on ${day.date}` : `Rest day on ${day.date}`}
                    className={`aspect-square w-full rounded-[4px] transition-colors ${
                      day.isFuture ? 'bg-transparent border border-white/[0.02]' :
                      day.intensity === 0 ? 'bg-white/[0.04] hover:bg-white/[0.06]' :
                      day.intensity === 1 ? 'bg-[#22C55E]/30' :
                      day.intensity === 2 ? 'bg-[#22C55E]/60' :
                      'bg-[#22C55E]' // Deep green for heavy days
                    } ${day.isToday ? 'border-[1.5px] border-white/70' : ''}`} // Highlights today
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