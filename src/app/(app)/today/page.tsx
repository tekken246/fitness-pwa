import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { startTodayWorkoutAction } from '@/lib/actions/workout-actions';
import { requireClerkUserId } from '@/lib/auth';
import { getOrCreateUserSettings } from '@/lib/data/settings';
import { getTemplateDayByIsoWeekday } from '@/lib/data/workout-templates';
import { getRecentWorkoutSessions, getSessionForDayOnDate } from '@/lib/data/workout-sessions';
import { getIsoWeekdayForTimezone, getLocalDateForTimezone } from '@/lib/timezone';

/** Renders the authenticated dashboard and today's workout. */
export default async function TodayPage(): Promise<ReactNode> {
  const clerkUserId = await requireClerkUserId();
  const settings = await getOrCreateUserSettings(clerkUserId);
  const now = new Date();
  const localDate = getLocalDateForTimezone(now, settings.timezone);
  const dayOfWeek = getIsoWeekdayForTimezone(now, settings.timezone);
  const day = await getTemplateDayByIsoWeekday(dayOfWeek);
  const existingSession = await getSessionForDayOnDate(clerkUserId, day.id, localDate);
  const recentSessions = await getRecentWorkoutSessions(clerkUserId);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">Dashboard</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Today</h1>
        <p className="mt-2 text-sm text-muted">{localDate} · {settings.timezone}</p>
      </Card>

      <Card className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{day.name}</p>
          <h2 className="text-2xl font-black tracking-tight">{day.muscleGroup}</h2>
        </div>

        {day.exercises.length > 0 ? (
          <ul className="space-y-2 text-sm text-muted">
            {day.exercises.map((exercise) => (
              <li className="rounded-2xl border border-border bg-background/45 px-3 py-2" key={exercise}>{exercise}</li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-border bg-background/45 p-4 text-sm text-muted">Rest day. No required workout.</p>
        )}

        {existingSession ? (
          <Link className="block h-12 rounded-2xl bg-primary px-4 py-3 text-center text-sm font-black uppercase tracking-[0.18em] text-background" href={`/sessions/${existingSession.id}`}>
            {existingSession.status === 'completed' ? 'Edit completed session' : 'Resume workout'}
          </Link>
        ) : day.exercises.length > 0 || day.isOptional ? (
          <form action={startTodayWorkoutAction}>
            <button className="h-12 w-full rounded-2xl bg-primary text-sm font-black uppercase tracking-[0.18em] text-background shadow-glow" type="submit">
              Start workout
            </button>
          </form>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight">Recent sessions</h2>
          <Link className="text-sm font-bold text-muted" href="/history">View all</Link>
        </div>
        <div className="mt-3 space-y-2">
          {recentSessions.slice(0, 3).map((session) => (
            <Link className="block rounded-2xl border border-border bg-background/45 p-3" href={`/sessions/${session.id}`} key={session.id}>
              <div className="font-bold">{session.muscleGroup}</div>
              <div className="text-sm text-muted">{session.localDate} · {session.status}</div>
            </Link>
          ))}
          {recentSessions.length === 0 ? <p className="text-sm text-muted">No sessions yet.</p> : null}
        </div>
      </Card>
    </div>
  );
}
