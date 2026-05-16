import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import { requireClerkUserId } from '@/lib/auth';
import { getExerciseHistoryForUser } from '@/lib/data/workout-sessions';

type ExerciseHistoryPageProps = {
  params: Promise<{ exerciseId: string }>;
};

/** Renders set-level history for one exercise. */
export default async function ExerciseHistoryPage({ params }: ExerciseHistoryPageProps): Promise<ReactNode> {
  const { exerciseId } = await params;
  const clerkUserId = await requireClerkUserId();
  const history = await getExerciseHistoryForUser(clerkUserId, exerciseId);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">Exercise history</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight">{exerciseId}</h1>
      </Card>

      <Card>
        <div className="space-y-2">
          {history.map((row, index) => (
            <div className="grid grid-cols-[1fr_auto] rounded-2xl border border-border bg-background/45 p-3" key={`${row.sessionId}-${index}`}>
              <div>
                <div className="font-bold">{row.localDate}</div>
                <div className="text-sm text-muted">{row.completed ? 'Completed' : 'Draft'}</div>
              </div>
              <div className="text-right font-black">
                {row.weight ?? '—'} {row.unit} × {row.reps ?? '—'}
              </div>
            </div>
          ))}
          {history.length === 0 ? <p className="text-sm text-muted">No history for this exercise.</p> : null}
        </div>
      </Card>
    </div>
  );
}
