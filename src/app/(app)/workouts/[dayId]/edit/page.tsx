import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, GripVertical, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import { db } from '@/db/client';
import { workoutTemplateDays, templateExerciseAssignments } from '@/db/schema';
import { Card } from '@/components/ui/card';
import { removeExerciseFromRoutineAction } from '@/lib/actions/builder-actions';

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function RoutineEditorPage({ params }: PageProps): Promise<ReactNode> {
  const { dayId } = await params;

  // 1. Fetch the routine details
  const [routine] = await db
    .select()
    .from(workoutTemplateDays)
    .where(eq(workoutTemplateDays.id, dayId));

  if (!routine) notFound();

  // 2. Fetch assigned exercises ordered by position
  const assignments = await db
    .select()
    .from(templateExerciseAssignments)
    .where(eq(templateExerciseAssignments.dayId, dayId))
    .orderBy(asc(templateExerciseAssignments.position));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workouts" className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{routine.name}</h1>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">{routine.muscleGroup}</p>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
            <p className="text-sm font-medium text-muted-foreground">No exercises added yet.</p>
            <p className="text-xs text-muted mt-1">Tap below to start building your routine.</p>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="flex items-center gap-3 p-4">
              <GripVertical className="h-5 w-5 text-muted/50 cursor-grab active:cursor-grabbing" />
              
              <div className="flex-1">
                <h3 className="font-bold">{assignment.displayName}</h3>
                <p className="text-xs text-muted">
                  {assignment.sets} sets • Target: {assignment.targetReps.join(', ')} reps
                </p>
              </div>

              {/* Remove Exercise Button */}
              <form action={removeExerciseFromRoutineAction}>
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <input type="hidden" name="dayId" value={dayId} />
                <button type="submit" className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </Card>
          ))
        )}
      </div>

      {/* Add Exercise CTA */}
      {/* NOTE: In the next step, this will open a Search Modal */}
      <Link 
        href={`/workouts/${dayId}/edit/add-exercise`}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 text-sm font-black uppercase tracking-[0.18em] text-primary hover:bg-primary/10 transition-colors"
      >
        <Plus className="h-5 w-5" />
        Add Exercise
      </Link>
    </div>
  );
}