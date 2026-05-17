import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getWeeklyPlan } from '@/lib/data/workout-templates';

/** Renders the routines and weekly schedule. */
export default async function WorkoutsPage(): Promise<ReactNode> {
  const plan = await getWeeklyPlan();

  // Safely separate legacy scheduled days from new floating routines
  const scheduledDays = plan.filter((day) => day.dayOfWeek !== null);
  const floatingRoutines = plan.filter((day) => day.dayOfWeek === null);

  return (
    <div className="space-y-8">
      {/* NEW: Flexible Routine Builder Interface */}
      <section className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">My Library</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Routines</h1>
            </div>
          </div>
        </Card>
        
        {floatingRoutines.length === 0 ? (
          <p className="px-2 text-sm text-muted">No custom routines yet. Create a flexible routine to start here.</p>
        ) : (
          floatingRoutines.map((routine) => <WorkoutCard key={routine.id} day={routine} label="Start Routine" />)
        )}
      </section>

      {/* EXISTING: Seed Schedule (Maintains backward compatibility) */}
      {scheduledDays.length > 0 && (
        <section className="space-y-4">
           <h2 className="px-2 text-sm font-bold uppercase tracking-[0.28em] text-muted">Weekly Schedule</h2>
          {scheduledDays.map((day) => (
            <WorkoutCard key={day.id} day={day} label="Start this day" />
          ))}
        </section>
      )}
    </div>
  );
}

/** Reusable Card Component to prevent code duplication */
function WorkoutCard({ day, label }: { day: any; label: string }) {
  return (
    <Card className="space-y-3">
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
            {label}
          </button>
        </form>
      ) : null}
    </Card>
  );
}