import type { ReactNode } from 'react';

import { ProgressDashboard } from '@/components/progress/progress-dashboard';
import { Card } from '@/components/ui/card';
import { requireClerkUserId } from '@/lib/auth';
import { getProgressSummariesForUser } from '@/lib/data/progress';

/** Renders strength analytics and exercise trend charts. */
export default async function ProgressPage(): Promise<ReactNode> {
  const clerkUserId = await requireClerkUserId();
  const summaries = await getProgressSummariesForUser(clerkUserId);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted">Progress</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Strength trends</h1>
        <p className="mt-2 text-sm text-muted">Epley estimated 1RM: weight × (1 + reps / 30).</p>
      </Card>
      <ProgressDashboard summaries={summaries} />
    </div>
  );
}
