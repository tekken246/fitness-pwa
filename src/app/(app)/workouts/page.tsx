import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getWeeklyPlan } from '@/lib/data/workout-templates';
import { createFlexibleRoutineAction } from '@/lib/actions/routine-actions';

/** Renders the routines and weekly schedule. */
export default async function WorkoutsPage(): Promise<ReactNode> {
  const plan = await getWeeklyPlan();

  // Safely separate legacy scheduled days from new floating routines
  const scheduledDays = plan.filter((day) => day.dayOfWeek !== null);
  const floatingRoutines = plan.filter((day) => day.dayOfWeek === null);

  return (
    <div className="space-y-8 pb-12">
      {/* NEW: Flexible Routine Builder Interface */}
      <section className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">My Library</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Routines</h1>
            </div>
          </div>
        </Card>

        {/* Create Routine Form */}
        <Card className="mb-4 border-dashed bg-muted/20 p-4">
          <form action={createFlexibleRoutineAction} className="flex flex-col gap-3">
            <input 
              name="name" 
              type="text" 
              placeholder="Routine Name (e.g., Push Day A)" 
              className="w-full rounded-md border p-2 text-sm bg-background" 
              required
            />
            <input 
              name="muscleGroup" 
              type="text" 
              placeholder="Target Muscles (e.g., Chest, Shoulders)" 
              className="w-full rounded-md border p-2 text-sm bg-background" 
              required
            />
            <button 
              type="submit" 
              className="h-10 w-full rounded-xl bg-primary text-xs font-black uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition-opacity"
            >
              + Create New Routine
            </button>
          </form>
        </Card>
        
        {floatingRoutines.length === 0 ? (
          <p className="px-2 text-sm text-muted">No custom routines yet. Create a flexible routine to start here.</p>
        ) : (
          floatingRoutines.map((routine) => <WorkoutCard key={routine.id} day={routine} label="Start Routine" isCustom />)
        )}
      </section>

      {/* EXISTING: Legacy Seed Schedule */}
      {scheduledDays.length > 0 && (
        <section className="space-y-4">
           <h2 className="px-2 text-sm font-bold uppercase tracking-[0.28em] text-muted">Weekly Schedule</h2>
          {scheduledDays.map((day) => (
            <WorkoutCard key={day.id} day={day} label="Start this day" isCustom={false} />
          ))}
        </section>
      )}
    </div>
  );
}

/** Reusable Card Component */
function WorkoutCard({ day, label, isCustom }: { day: any; label: string; isCustom: boolean }) {
  // Custom routines go to the editor, scheduled days go to legacy details
  const detailLink = isCustom ? `/workouts/${day.id}/edit` : `/workouts/${day.id}`;

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{day.name}</p>
          <h2 className="text-xl font-black tracking-tight">{day.muscleGroup}</h2>
        </div>
        <Link className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted hover:bg-muted/50 transition-colors" href={detailLink}>
          {isCustom ? 'Edit' : 'Details'}
        </Link>
      </div>

      {day.exercises && day.exercises.length > 0 ? (
        <p className="text-sm text-muted">{day.exercises.join(' · ')}</p>
      ) : (
        <p className="text-sm text-muted italic">No exercises added yet.</p>
      )}

      {(day.exercises && day.exercises.length > 0) || day.isOptional ? (
        <form action={startWorkoutForDayAction}>
          <input name="dayId" type="hidden" value={day.id} />
          <button className="mt-2 h-11 w-full rounded-2xl bg-primary text-xs font-black uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition-opacity" type="submit">
            {label}
          </button>
        </form>
      ) : null}
    </Card>
  );
}