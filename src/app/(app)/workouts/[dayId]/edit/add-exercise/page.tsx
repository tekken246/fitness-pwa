import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { db } from '@/db/client';
import { workoutTemplateDays, exercises } from '@/db/schema';
import { requireClerkUserId } from '@/lib/auth';
import { assertEditableTemplateDay } from '@/lib/data/routine-access';
import { ExerciseSearchList } from './exercise-search-list';

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function AddExercisePage({ params }: PageProps): Promise<ReactNode> {
  const { dayId } = await params;
  const clerkUserId = await requireClerkUserId();
  // Only the owner of this routine may add exercises to it.
  await assertEditableTemplateDay(dayId, clerkUserId);

  const [routine] = await db.select().from(workoutTemplateDays).where(eq(workoutTemplateDays.id, dayId));
  if (!routine) notFound();

  // Fetch only the columns the picker renders, keeping the payload small for ~800 rows.
  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      category: exercises.category,
      equipment: exercises.equipment,
      primaryMuscles: exercises.primaryMuscles,
      images: exercises.images,
    })
    .from(exercises)
    .orderBy(asc(exercises.name));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col space-y-4 text-white">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href={`/workouts/${dayId}/edit`}
          aria-label="Back to routine"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-white">Add exercises</h1>
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">{routine.name}</p>
        </div>
      </div>

      <ExerciseSearchList exercises={allExercises} dayId={dayId} />
    </div>
  );
}
