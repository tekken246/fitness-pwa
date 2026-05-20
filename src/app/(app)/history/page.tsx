import Link from 'next/link';
import type { ReactNode } from 'react';
import { desc, eq, sql } from 'drizzle-orm';
import { Search, ChevronRight, Activity, Clock, Dumbbell, Trophy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { db } from '@/db/client';
import { workoutSessions, workoutTemplateDays, workoutExerciseEntries } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';

interface PageProps {
  searchParams: Promise<{ tab?: string; q?: string }>;
}

export default async function HistoryPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { tab = 'sessions', q = '' } = await searchParams;
  const clerkUserId = await requireClerkUserId();
  
  // 1. Fetch Real Live Completed/Active Sessions from Database
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

  // 2. Fetch Distinct Exercises the User Has Logged Sets For
  const loggedExercises = await db
    .selectDistinct({
      id: workoutExerciseEntries.exerciseId,
      name: sql<string>`max(${workoutExerciseEntries.notes})`, // Placeholder fallback for matching
    })
    .from(workoutExerciseEntries)
    .where(eq(workoutSessions.clerkUserId, clerkUserId))
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutExerciseEntries.sessionId))
    .limit(10);

  // Simple relative time helper
  const getRelativeTime = (date: Date) => {
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6 pb-28 text-white">
      {/* Header & Tabs */}
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

      {/* ================= SESSIONS TAB ================= */}
      {tab === 'sessions' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {realSessions.length === 0 ? (
            <div className="text-center py-12 text-white/45 text-[14px]">
              No workout logs found. Start a workout on the dashboard to see history!
            </div>
          ) : (
            realSessions.map((session) => (
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

                  <div className="mt-4 flex items-center gap-4 text-[13px] text-white/60">
                    <div className="flex items-center gap-1.5"><Dumbbell className="h-4 w-4 text-white/40" /> Active sets</div>
                    <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-white/40" /> Tracked</div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ================= EXERCISES TAB ================= */}
      {tab === 'exercises' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-2">
            {['Flat Bench Press', 'Incline Dumbbell Press', 'Cable Fly', 'Tricep Pushdown', 'Barbell Squat'].map((name, i) => (
              <Link href={`/progress?exercise=${encodeURIComponent(name)}`} key={name} className="block">
                <Card className="flex items-center justify-between rounded-[16px] border-white/[0.06] bg-white/[0.04] p-3 hover:border-[#22C55E]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-white/[0.05] border border-white/[0.08]">
                      <Dumbbell className="h-5 w-5 text-white/30" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">{name}</h3>
                      <p className="text-[12px] text-white/45 mt-0.5">Tap to view metrics & trends</p>
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