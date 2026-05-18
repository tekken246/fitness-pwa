import Link from 'next/link';
import type { ReactNode } from 'react';
import { Plus, Dumbbell, CalendarDays, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getWeeklyPlan } from '@/lib/data/workout-templates';
import { createFlexibleRoutineAction } from '@/lib/actions/routine-actions';

export default async function WorkoutsPage(): Promise<ReactNode> {
  const plan = await getWeeklyPlan();

  const scheduledDays = plan.filter((day) => day.dayOfWeek !== null);
  const floatingRoutines = plan.filter((day) => day.dayOfWeek === null);

  return (
    <div className="space-y-10 pb-12">
      {/* My Library Section */}
      <section className="space-y-5">
        <div className="px-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Routines</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
            <Dumbbell className="h-4 w-4" /> Your custom workout library
          </p>
        </div>

        {/* Create Routine Form - Sleek & Native Feel */}
        <Card className="rounded-3xl border-border/40 bg-muted/20 p-2 shadow-sm">
          <form action={createFlexibleRoutineAction} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input 
                name="name" 
                type="text" 
                placeholder="Routine Name (e.g. Push Day)" 
                className="h-12 w-full rounded-2xl border-none bg-background px-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60" 
                required
              />
              <input 
                name="muscleGroup" 
                type="text" 
                placeholder="Muscles" 
                className="h-12 w-1/3 rounded-2xl border-none bg-background px-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/60" 
                required
              />
            </div>
            <button 
              type="submit" 
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="h-5 w-5" /> Create Routine
            </button>
          </form>
        </Card>
        
        {/* Custom Routines Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {floatingRoutines.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No custom routines yet.</p>
            </div>
          ) : (
            floatingRoutines.map((routine) => <WorkoutCard key={routine.id} day={routine} label="Start Routine" isCustom />)
          )}
        </div>
      </section>

      {/* Legacy Weekly Schedule */}
      {scheduledDays.length > 0 && (
        <section className="space-y-5">
          <div className="px-1">
            <h2 className="text-xl font-bold tracking-tight">Weekly Schedule</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Your seeded 7-day plan
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
    <Card className="group relative overflow-hidden rounded-3xl border-border/40 bg-card shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">{day.name}</h2>
            <p className="text-[13px] font-semibold text-primary">{day.muscleGroup}</p>
          </div>
          <Link 
            className="shrink-0 flex h-9 items-center gap-1 rounded-full bg-muted/40 pl-3 pr-2 text-xs font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" 
            href={detailLink}
          >
            {isCustom ? 'Edit' : 'View'} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {day.exercises && day.exercises.length > 0 ? (
          <p className="text-[13px] font-medium text-muted-foreground/80 leading-relaxed line-clamp-2">
            {day.exercises.join(' • ')}
          </p>
        ) : (
          <p className="text-[13px] italic text-muted-foreground/50">No exercises added yet.</p>
        )}
      </div>

      {(day.exercises && day.exercises.length > 0) || day.isOptional ? (
        <div className="p-2 pt-0">
          <form action={startWorkoutForDayAction}>
            <input name="dayId" type="hidden" value={day.id} />
            <button className="h-12 w-full rounded-2xl bg-foreground text-sm font-bold text-background hover:bg-primary hover:text-primary-foreground transition-all shadow-sm" type="submit">
              {label}
            </button>
          </form>
        </div>
      ) : null}
    </Card>
  );
}