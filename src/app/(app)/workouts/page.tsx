import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getWeeklyPlan } from '@/lib/data/workout-templates';

/** Renders the weekly seed workout plan. */
export default async function WorkoutsPage(): Promise<ReactNode> {
  const plan = await getWeeklyPlan();

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">Weekly plan</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Seed schedule</h1>
      </Card>

      {plan.map((day) => (
        <Card className="space-y-3" key={day.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{day.name}</p>
              <h2 className="text-xl font-black tracking-tight">{day.muscleGroup}</h2>
            </div>
            <Link className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted" href={`/workouts/${day.id}`}>
              Details
            </Link>
          </div>

          {day.exercises.length > 0 ? (
            <p className="text-sm text-muted">{day.exercises.join(' · ')}</p>
          ) : (
            <p className="text-sm text-muted">No required exercises.</p>
          )}

          {day.exercises.length > 0 || day.isOptional ? (
            <form action={startWorkoutForDayAction}>
              <input name="dayId" type="hidden" value={day.id} />
              <button className="h-11 w-full rounded-2xl bg-primary text-xs font-black uppercase tracking-[0.18em] text-background" type="submit">
                Start this day
              </button>
            </form>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
