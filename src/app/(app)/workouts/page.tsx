import Link from 'next/link';
import type { ReactNode } from 'react';
import { Plus, Dumbbell, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getWeeklyPlan } from '@/lib/data/workout-templates';
import { createFlexibleRoutineAction } from '@/lib/actions/routine-actions';

export default async function WorkoutsPage(): Promise<ReactNode> {
  const plan = await getWeeklyPlan();

  // Safely separate legacy scheduled days from new floating routines
  const scheduledDays = plan.filter((day) => day.dayOfWeek !== null);
  const floatingRoutines = plan.filter((day) => day.dayOfWeek === null);

  return (
    <div className="space-y-8 pb-12">
      {/* My Library Section */}
      <section className="space-y-4">
        <div className="flex items-end justify-between px-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted flex items-center gap-2">
              <Dumbbell className="h-4 w-4" /> My Library
            </p>
            <h1 className="text-3xl font-black tracking-tight mt-1">Routines</h1>
          </div>
        </div>

        {/* Create Routine Form */}
        <Card className="border-dashed bg-muted/10 p-4 shadow-none">
          <form action={createFlexibleRoutineAction} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input 
                name="name" 
                type="text" 
                placeholder="Routine Name (e.g., Push Day)" 
                className="w-full rounded-xl border-none bg-muted/50 p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" 
                required
              />
              <input 
                name="muscleGroup" 
                type="text" 
                placeholder="Muscles" 
                className="w-1/3 rounded-xl border-none bg-muted/50 p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" 
                required
              />
            </div>
            <button 
              type="submit" 
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-black uppercase tracking-[0.18em] text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> Create Routine
            </button>
          </form>
        </Card>
        
        {/* Custom Routines Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {floatingRoutines.length === 0 ? (
            <div className="col-span-full py-8 text-center text-sm text-muted">
              No custom routines yet. Build your first one above.
            </div>
          ) : (
            floatingRoutines.map((routine) => <WorkoutCard key={routine.id} day={routine} label="Start Routine" isCustom />)
          )}
        </div>
      </section>

      <hr className="border-border/50" />

      {/* Legacy Weekly Schedule */}
      {scheduledDays.length > 0 && (
        <section className="space-y-4">
          <h2 className="px-2 text-xs font-bold uppercase tracking-[0.28em] text-muted flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Weekly Schedule
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {scheduledDays.map((day) => (
              <WorkoutCard key={day.id} day={day} label="Start" isCustom={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function WorkoutCard({ day, label, isCustom }: { day: any; label: string; isCustom: boolean }) {
  const detailLink = isCustom ? `/workouts/${day.id}/edit` : `/workouts/${day.id}`;

  return (
    <Card className="group flex flex-col justify-between overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{day.name}</p>
            <h2 className="text-xl font-black tracking-tight mt-1">{day.muscleGroup}</h2>
          </div>
          <Link className="shrink-0 rounded-full bg-muted/50 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" href={detailLink}>
            {isCustom ? 'Edit' : 'View'}
          </Link>
        </div>

        {day.exercises && day.exercises.length > 0 ? (
          <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-2">
            {day.exercises.join(' • ')}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground/60">No exercises added yet.</p>
        )}
      </div>

      {(day.exercises && day.exercises.length > 0) || day.isOptional ? (
        <div className="bg-muted/10 p-3 border-t border-border/50">
          <form action={startWorkoutForDayAction}>
            <input name="dayId" type="hidden" value={day.id} />
            <button className="h-10 w-full rounded-xl bg-foreground text-xs font-black uppercase tracking-[0.18em] text-background hover:bg-primary transition-colors" type="submit">
              {label}
            </button>
          </form>
        </div>
      ) : null}
    </Card>
  );
}