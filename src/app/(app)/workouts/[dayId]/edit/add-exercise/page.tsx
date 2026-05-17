import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { db } from '@/db/client';
import { workoutTemplateDays, exercises } from '@/db/schema';
import { ExerciseSearchList } from './exercise-search-list';

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function AddExercisePage({ params }: PageProps): Promise<ReactNode> {
  const { dayId } = await params;

  // Verify the routine exists
  const [routine] = await db
    .select()
    .from(workoutTemplateDays)
    .where(eq(workoutTemplateDays.id, dayId));

  if (!routine) notFound();

  // Fetch all exercises from the database, ordered alphabetically
  const allExercises = await db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.name));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-4">
        <Link href={`/workouts/${dayId}/edit`} className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Add Exercise</h1>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{routine.name}</p>
        </div>
      </div>

      {/* Interactive Client-Side Search List */}
      <ExerciseSearchList exercises={allExercises} dayId={dayId} />
    </div>
  );
}