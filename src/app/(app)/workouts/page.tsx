import Link from 'next/link';
import type { ReactNode } from 'react';
import { Dumbbell, CalendarDays, ChevronRight, Play, Moon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getRoutinesForUser, getSeedWeeklyPlan } from '@/lib/data/workout-templates';
import { CreateRoutineButton } from '@/components/workout/create-routine-button';
import { requireClerkUserId } from '@/lib/auth';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function WorkoutsPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { tab = 'routines' } = await searchParams;
  const clerkUserId = await requireClerkUserId();

  // Seed plan is shared and read-only; "My Routines" are private to this user.
  const [scheduledDays, floatingRoutines] = await Promise.all([
    getSeedWeeklyPlan(),
    getRoutinesForUser(clerkUserId),
  ]);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 pb-24 text-white">
      
      {/* Page Header & Segmented Tabs */}
      <div className="space-y-5 px-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-white">Plan</h1>
        
        <div className="flex h-[40px] w-full items-center rounded-[20px] bg-white/[0.03] p-1 border border-white/[0.05]">
          <Link 
            href="/workouts?tab=routines" 
            className={`flex h-full flex-1 items-center justify-center rounded-[16px] text-[13px] font-semibold transition-all ${
              tab === 'routines' ? 'bg-[#22C55E] text-black shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            My Routines
          </Link>
          <Link 
            href="/workouts?tab=schedule" 
            className={`flex h-full flex-1 items-center justify-center rounded-[16px] text-[13px] font-semibold transition-all ${
              tab === 'schedule' ? 'bg-[#22C55E] text-black shadow-sm' : 'text-white/70 hover:text-white'
            }`}
          >
            Weekly Schedule
          </Link>
        </div>
      </div>

      {/* =========================================
          TAB: ROUTINES (Custom Library) 
          ========================================= */}
      {tab === 'routines' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Create routine (collapsible → opens the exercise picker on submit) */}
          <CreateRoutineButton />


          {/* Routine List */}
          <div className="grid gap-3">
            {floatingRoutines.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-white/[0.08] p-8 text-center mt-4">
                <Dumbbell className="mb-3 h-8 w-8 text-white/20" />
                <p className="text-[15px] font-semibold text-white">No routines yet</p>
                <p className="mt-1 text-[13px] text-white/45">Create your first custom routine above.</p>
              </div>
            ) : (
              floatingRoutines.map((routine) => <RoutineCard key={routine.id} day={routine} />)
            )}
          </div>
        </section>
      )}

      {/* =========================================
          TAB: SCHEDULE (Seeded Plan) 
          ========================================= */}
      {tab === 'schedule' && (
        <section className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Week Strip */}
          <div className="flex justify-between px-1 border-b border-white/[0.06] pb-4">
            {scheduledDays.map((day, index) => {
              const isRest = day.exercises.length === 0 && !day.isOptional;
              return (
                <div key={day.id} className="flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-white/45">{dayLabels[index]}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${isRest ? 'border-dashed border-white/20 bg-transparent' : 'border-white/10 bg-white/[0.05]'}`}>
                    {isRest ? <Moon className="h-3.5 w-3.5 text-white/30" /> : <Dumbbell className="h-3.5 w-3.5 text-[#22C55E]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day Cards */}
          <div className="grid gap-3">
            {scheduledDays.map((day) => (
              <ScheduleCard key={day.id} day={day} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Sub-Components (Styled for Level 1 Elevation)
// ----------------------------------------------------------------------

function RoutineCard({ day }: { day: any }) {
  const count: number = day.exercises?.length ?? 0;
  const estMinutes = Math.max(15, count * 8);

  return (
    <Card className="flex flex-col justify-between overflow-hidden rounded-[20px] border-white/[0.08] bg-white/[0.05] shadow-sm hover:border-white/[0.15] transition-colors">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-white">{day.name}</h3>
            {/* Muscle Group Chip */}
            <div className="mt-1.5 inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 border border-blue-500/20">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">{day.muscleGroup}</span>
            </div>
          </div>
          <Link 
            href={`/workouts/${day.id}/edit`}
            className="text-[13px] font-medium text-[#22C55E] hover:opacity-80 transition-opacity"
          >
            Edit
          </Link>
        </div>

        <p className="text-[13px] font-medium text-white/50 truncate">
          {day.exercises && day.exercises.length > 0 
            ? day.exercises.join(' • ') 
            : 'No exercises added'}
        </p>

        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white/40">
          <Dumbbell className="h-3.5 w-3.5" /> {count} exercise{count === 1 ? '' : 's'}
          {count > 0 ? ` · ~${estMinutes} min` : ''}
        </p>
      </div>

      {(day.exercises && day.exercises.length > 0) && (
        <div className="p-2 pt-0">
          <form action={startWorkoutForDayAction}>
            <input name="dayId" type="hidden" value={day.id} />
            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-transparent text-[14px] font-semibold text-white hover:bg-white/[0.03] transition-colors" type="submit">
              <Play className="h-4 w-4" /> Start Routine
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}

function ScheduleCard({ day }: { day: any }) {
  const isRest = day.exercises.length === 0 && !day.isOptional;
  const dayName = day.name; // e.g. "Monday"
  const count: number = day.exercises?.length ?? 0;
  const estMinutes = Math.max(15, count * 8);

  return (
    <Card className={`overflow-hidden rounded-[20px] border-white/[0.08] bg-white/[0.05] shadow-sm ${isRest ? 'opacity-60' : ''}`}>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{dayName}</p>
          <div className="flex items-center justify-between mt-1">
            <h3 className="text-[17px] font-semibold tracking-tight text-white">{day.muscleGroup}</h3>
            {!isRest && (
              <Link href={`/workouts/${day.id}`} className="text-[13px] font-medium text-white/50 hover:text-white transition-colors">
                View
              </Link>
            )}
          </div>
        </div>

        {isRest ? (
          <div className="flex items-center gap-2 text-white/45">
            <Moon className="h-4 w-4" />
            <span className="text-[13px] font-medium">Rest Day</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-white/50 leading-relaxed line-clamp-2">
              {day.exercises.join(' • ')}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-white/40">
              <Dumbbell className="h-3.5 w-3.5" /> {count} exercise{count === 1 ? '' : 's'} · ~{estMinutes} min
            </p>
          </div>
        )}
      </div>

      {!isRest && (
        <div className="p-2 pt-0">
          <form action={startWorkoutForDayAction}>
            <input name="dayId" type="hidden" value={day.id} />
            <button className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-transparent text-[14px] font-semibold text-white hover:bg-white/[0.03] transition-colors" type="submit">
              <Play className="h-4 w-4" /> Start
            </button>
          </form>
        </div>
      )}
    </Card>
  );
}