import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, GripVertical, Plus, CheckCircle2, Dumbbell } from 'lucide-react';
import type { ReactNode } from 'react';

import { db } from '@/db/client';
import { workoutTemplateDays, templateExerciseAssignments, exercises } from '@/db/schema';
import { Card } from '@/components/ui/card';
import { removeExerciseFromRoutineAction } from '@/lib/actions/builder-actions';

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function RoutineEditorPage({ params }: PageProps): Promise<ReactNode> {
  const { dayId } = await params;

  // 1. Fetch routine details
  const [routine] = await db
    .select()
    .from(workoutTemplateDays)
    .where(eq(workoutTemplateDays.id, dayId));

  if (!routine) notFound();

  // 2. Fetch assignments WITH images from the exercises table
  const assignments = await db
    .select({
      id: templateExerciseAssignments.id,
      displayName: templateExerciseAssignments.displayName,
      sets: templateExerciseAssignments.sets,
      targetReps: templateExerciseAssignments.targetReps,
      images: exercises.images, // Pulling the image array!
    })
    .from(templateExerciseAssignments)
    .innerJoin(exercises, eq(exercises.id, templateExerciseAssignments.exerciseId))
    .where(eq(templateExerciseAssignments.dayId, dayId))
    .orderBy(asc(templateExerciseAssignments.position));

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workouts" className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{routine.name}</h1>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{routine.muscleGroup}</p>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed bg-muted/10 shadow-none">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">Your routine is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Add some exercises below to get started.</p>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="flex items-center gap-3 p-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <GripVertical className="h-5 w-5 shrink-0 text-muted/30 cursor-grab active:cursor-grabbing" />
              
              {/* Thumbnail Image */}
              {assignment.images && assignment.images[0] ? (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-white p-1 border">
                  <img 
                    src={assignment.images[0]} 
                    alt={assignment.displayName} 
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-muted flex items-center justify-center border">
                  <Dumbbell className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{assignment.displayName}</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {assignment.sets} sets • {assignment.targetReps[0]} reps
                </p>
              </div>

              {/* Remove Exercise Button */}
              <form action={removeExerciseFromRoutineAction}>
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <input type="hidden" name="dayId" value={dayId} />
                <button type="submit" className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </Card>
          ))
        )}
      </div>

      {/* Action Buttons (Add & Save) */}
      <div className="space-y-3 pt-4">
        <Link 
          href={`/workouts/${dayId}/edit/add-exercise`}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 text-sm font-black uppercase tracking-[0.18em] text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Exercise
        </Link>

        {/* Psychological "Save" Button - Since data auto-saves, this just routes home */}
        <Link 
          href="/workouts"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-black uppercase tracking-[0.18em] text-background hover:bg-primary transition-colors"
        >
          <CheckCircle2 className="h-5 w-5" />
          Done & Save Routine
        </Link>
      </div>
    </div>
  );
}