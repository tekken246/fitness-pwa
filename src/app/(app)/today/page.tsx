import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronRight, Play, CheckCircle2, Flame, TrendingUp, Dumbbell, Timer } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { startTodayWorkoutAction, startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { requireClerkUserId } from '@/lib/auth';
import { getOrCreateUserSettings } from '@/lib/data/settings';
import { getRoutinesForUser, getTemplateDayByIsoWeekday } from '@/lib/data/workout-templates';
import { getAverageWorkoutMinutes } from '@/lib/data/workout-sessions';
import { getRecentWorkoutSessions, getSessionForDayOnDate } from '@/lib/data/workout-sessions';
import { getIsoWeekdayForTimezone, getLocalDateForTimezone } from '@/lib/timezone';
import { currentUser } from '@clerk/nextjs/server';
import { getWorkoutStreak, getWeeklyGoalProgress, getVolumeMomentum, getSessionMetricsMap } from '@/lib/data/activity-stats';

/** Renders the authenticated premium dashboard and today's workout. */
export default async function TodayPage(): Promise<ReactNode> {
  const clerkUserId = await requireClerkUserId();
  const settings = await getOrCreateUserSettings(clerkUserId);
  const now = new Date();
  
  const localDate = getLocalDateForTimezone(now, settings.timezone);
  const dayOfWeek = getIsoWeekdayForTimezone(now, settings.timezone);
  
  // Data Fetching
  const day = await getTemplateDayByIsoWeekday(dayOfWeek);
  const existingSession = await getSessionForDayOnDate(clerkUserId, day.id, localDate);
  const recentSessions = await getRecentWorkoutSessions(clerkUserId);

  // Quick Start shows the user's own routines (private to them).
  const customRoutines = await getRoutinesForUser(clerkUserId);
  const avgWorkoutMinutes = await getAverageWorkoutMinutes(clerkUserId);

  // Batch 2 stats (additive aggregate queries)
  const user = await currentUser();
  const firstName = user?.firstName ?? null;
  const [streak, weekly, momentum] = await Promise.all([
    getWorkoutStreak(clerkUserId, settings.timezone, now),
    getWeeklyGoalProgress(clerkUserId, settings.timezone, now),
    getVolumeMomentum(clerkUserId, settings.timezone, now),
  ]);
  const recentMetrics = await getSessionMetricsMap(recentSessions.slice(0, 3).map((session) => session.id));

  const unitLabel = settings.unit;
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: settings.timezone }).format(now));
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const ringRadius = 15;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - Math.min(1, weekly.count / weekly.goal));

  const formatVol = (value: number): string => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`);
  const formatDur = (seconds: number | null): string | null => {
    if (seconds === null) return null;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  // Date Formatting for Header
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: settings.timezone }).format(now);
  const dateFormatted = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: settings.timezone }).format(now);

  return (
    <div className="space-y-8 pb-24 text-white">
      
      {/* T1. Compact Premium Header */}
      <div className="px-1 pt-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{dayName} · {dateFormatted}</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight text-white">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
      </div>

      {/* T2. Stats strip: streak · weekly goal · momentum */}
      <div className="grid grid-cols-3 gap-3 px-1">
        <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-4">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Flame className="h-4 w-4" />
            <span className="text-[24px] font-black leading-none text-white">{streak}</span>
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Day streak</p>
        </div>

        <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-4">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0">
              <svg width="36" height="36" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r={ringRadius}
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 18 18)"
                />
              </svg>
            </div>
            <span className="text-[16px] font-black leading-none text-white">
              {weekly.count}
              <span className="text-white/40">/{weekly.goal}</span>
            </span>
          </div>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">This week</p>
        </div>

        <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-4">
          {momentum.deltaPct === null ? (
            <div className="flex items-center gap-1.5 text-white/70">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[16px] font-black leading-none text-white">New</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 ${momentum.deltaPct >= 0 ? 'text-[#22C55E]' : 'text-white/60'}`}>
              <TrendingUp className={`h-4 w-4 ${momentum.deltaPct >= 0 ? '' : 'rotate-180'}`} />
              <span className="text-[20px] font-black leading-none text-white">
                {momentum.deltaPct >= 0 ? '+' : ''}
                {momentum.deltaPct}%
              </span>
            </div>
          )}
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">Vs last week</p>
        </div>
      </div>

      {/* T3. Redesigned Workout Card (Elevation Level 2) */}
      <Card className="rounded-[20px] border-white/10 bg-white/[0.07] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22C55E]">Today's Workout</p>
          <h2 className="mt-1 text-[20px] font-semibold text-white tracking-tight">{day.muscleGroup}</h2>
          <p className="text-[15px] font-normal text-white/70 mt-0.5">
            {day.exercises.length > 0 ? `${day.exercises.length} exercises · ~${avgWorkoutMinutes ?? Math.max(20, day.exercises.length * 8)} min` : 'Recovery day'}
          </p>
        </div>

        {day.exercises.length > 0 ? (
          <div className="mb-6 space-y-3">
            {day.exercises.slice(0, 3).map((exercise) => (
              <div key={exercise} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-white/20"></div>
                <span className="text-[15px] font-normal text-white/90">{exercise}</span>
              </div>
            ))}
            {day.exercises.length > 3 && (
              <p className="pl-5 text-[13px] font-normal text-white/45">+{day.exercises.length - 3} more</p>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-[12px] border border-white/5 bg-white/[0.03] p-4 text-center">
            <p className="text-[15px] text-white/70">Rest day. Take it easy.</p>
          </div>
        )}

        {existingSession ? (
          <Link className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#22C55E] text-[15px] font-semibold text-black transition-opacity hover:opacity-90" href={`/sessions/${existingSession.id}`}>
            {existingSession.status === 'completed' ? 'Edit Completed Session' : 'Resume Workout'}
          </Link>
        ) : day.exercises.length > 0 || day.isOptional ? (
          <form action={startTodayWorkoutAction}>
            <button className="flex h-12 w-full items-center justify-center rounded-[12px] bg-[#22C55E] text-[15px] font-semibold text-black transition-opacity hover:opacity-90 shadow-[0_0_20px_rgba(34,197,94,0.15)]" type="submit">
              Start Workout
            </button>
          </form>
        ) : null}
      </Card>

      {/* T5. Quick Start Row (Elevation Level 0) */}
      {customRoutines.length > 0 && (
        <div className="space-y-3">
          <h3 className="px-1 text-[17px] font-semibold text-white tracking-tight">Quick Start</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 pl-1 pr-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {customRoutines.map((routine) => (
              <form key={routine.id} action={startWorkoutForDayAction} className="shrink-0 snap-start">
                <input name="dayId" type="hidden" value={routine.id} />
                <button type="submit" className="flex items-center gap-2.5 rounded-[100px] border border-white/[0.08] bg-white/[0.03] px-4 py-2 hover:bg-white/[0.06] transition-colors">
                  <Play className="h-3.5 w-3.5 fill-[#22C55E] text-[#22C55E]" />
                  <p className="text-[13px] font-medium text-white">{routine.name}</p>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* T4. Recent Sessions (Elevation Level 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[17px] font-semibold text-white tracking-tight">Recent Sessions</h3>
          <Link className="text-[13px] font-medium text-[#22C55E] hover:opacity-80" href="/history">View all</Link>
        </div>
        
        <div className="space-y-3">
          {recentSessions.slice(0, 3).map((session) => {
            const m = recentMetrics.get(session.id);
            const dur = formatDur(m?.durationSeconds ?? null);
            return (
              <Link key={session.id} href={`/sessions/${session.id}`} className="group flex items-center justify-between rounded-[16px] border border-white/[0.08] bg-white/[0.05] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.07]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-semibold text-white group-hover:text-[#22C55E] transition-colors">{session.muscleGroup}</h4>
                    {session.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-white/45">
                    <span>{session.localDate}</span>
                    {m && m.sets > 0 ? (
                      <>
                        <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {formatVol(m.volume)} {unitLabel}</span>
                        <span>{m.sets} sets</span>
                        {dur ? (
                          <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {dur}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="capitalize">{session.status}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/30 group-hover:text-white/60 transition-colors" />
              </Link>
            );
          })}
          {recentSessions.length === 0 && (
            <div className="rounded-[16px] border border-dashed border-white/[0.08] p-6 text-center">
              <p className="text-[13px] text-white/45">No sessions yet. Time to get started!</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}