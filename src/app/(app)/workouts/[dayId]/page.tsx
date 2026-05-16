import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { startWorkoutForDayAction } from '@/lib/actions/workout-actions';
import { getTemplateDayDetail } from '@/lib/data/workout-templates';

type WorkoutDayPageProps = {
  params: Promise<{ dayId: string }>;
};

/** Renders details for one seeded workout day. */
export default async function WorkoutDayPage({ params }: WorkoutDayPageProps): Promise<ReactNode> {
  const { dayId } = await params;
  const detail = await getTemplateDayDetail(dayId);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">{detail.day.name}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{detail.day.muscleGroup}</h1>
      </Card>

      <div className="space-y-3">
        {detail.exercises.map((exercise) => (
          <Card className="space-y-2" key={exercise.assignmentId}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight">{exercise.displayName}</h2>
              <span className="rounded-full bg-background/60 px-3 py-1 text-xs font-bold text-muted">Set {exercise.sets}</span>
            </div>
            <p className="text-sm text-muted">
              {exercise.targetNote ?? `Targets: ${exercise.targetReps.join(' / ')}`}
            </p>
          </Card>
        ))}
      </div>

      {detail.exercises.length > 0 || detail.day.isOptional ? (
        <form action={startWorkoutForDayAction} className="sticky bottom-24 rounded-3xl border border-border bg-background/90 p-3 backdrop-blur-xl">
          <input name="dayId" type="hidden" value={detail.day.id} />
          <button className="h-12 w-full rounded-2xl bg-primary text-sm font-black uppercase tracking-[0.18em] text-background" type="submit">
            Start workout
          </button>
        </form>
      ) : null}
    </div>
  );
}
