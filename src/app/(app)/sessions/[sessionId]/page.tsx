import type { ReactNode } from 'react';

import { ActiveWorkoutLogger } from '@/components/workout/active-workout-logger';
import { requireClerkUserId } from '@/lib/auth';
import { getExerciseCatalog, getWorkoutSessionView } from '@/lib/data/workout-sessions';

type SessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

/** Renders an active or completed workout logging session. */
export default async function SessionPage({ params }: SessionPageProps): Promise<ReactNode> {
  const { sessionId } = await params;
  const clerkUserId = await requireClerkUserId();
  const [session, catalog] = await Promise.all([
    getWorkoutSessionView(clerkUserId, sessionId),
    getExerciseCatalog(),
  ]);

  return <ActiveWorkoutLogger session={session} catalog={catalog} />;
}
