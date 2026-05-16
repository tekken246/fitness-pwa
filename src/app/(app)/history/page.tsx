import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { requireClerkUserId } from '@/lib/auth';
import { getLoggedExercisesForUser, getRecentWorkoutSessions } from '@/lib/data/workout-sessions';

/** Renders session history and exercise history entry points. */
export default async function HistoryPage(): Promise<ReactNode> {
  const clerkUserId = await requireClerkUserId();
  const sessions = await getRecentWorkoutSessions(clerkUserId);
  const exercises = await getLoggedExercisesForUser(clerkUserId);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">History</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Workout log</h1>
      </Card>

      <Card>
        <h2 className="text-lg font-black tracking-tight">Sessions</h2>
        <div className="mt-3 space-y-2">
          {sessions.map((session) => (
            <Link className="block rounded-2xl border border-border bg-background/45 p-3" href={`/sessions/${session.id}`} key={session.id}>
              <div className="font-bold">{session.muscleGroup}</div>
              <div className="text-sm text-muted">{session.localDate} · {session.status}</div>
            </Link>
          ))}
          {sessions.length === 0 ? <p className="text-sm text-muted">No workout sessions yet.</p> : null}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-black tracking-tight">Exercise history</h2>
        <div className="mt-3 grid gap-2">
          {exercises.map((exercise) => (
            <Link className="rounded-2xl border border-border bg-background/45 p-3 font-bold" href={`/history/${exercise.id}`} key={exercise.id}>
              {exercise.name}
            </Link>
          ))}
          {exercises.length === 0 ? <p className="text-sm text-muted">Log sets to populate exercise history.</p> : null}
        </div>
      </Card>
    </div>
  );
}
