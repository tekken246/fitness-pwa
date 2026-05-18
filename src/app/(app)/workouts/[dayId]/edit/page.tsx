'use client';

import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, GripVertical, Plus, CheckCircle2, Dumbbell } from 'lucide-react';
import { use } from 'react';

import { db } from '@/db/client';
import { workoutTemplateDays, templateExerciseAssignments, exercises } from '@/db/schema';
import { Card } from '@/components/ui/card';
import { removeExerciseFromRoutineAction } from '@/lib/actions/builder-actions';
import { deleteFlexibleRoutineAction } from '@/lib/actions/routine-actions';

interface PageProps {
  params: Promise<{ dayId: string }>;
}

export default async function RoutineEditorPage({ params }: PageProps) {
  const { dayId } = await params;

  const [routine] = await db
    .select()
    .from(workoutTemplateDays)
    .where(eq(workoutTemplateDays.id, dayId));

  if (!routine) notFound();

  const assignments = await db
    .select({
      id: templateExerciseAssignments.id,
      displayName: templateExerciseAssignments.displayName,
      sets: templateExerciseAssignments.sets,
      targetReps: templateExerciseAssignments.targetReps,
      images: exercises.images, 
    })
    .from(templateExerciseAssignments)
    .innerJoin(exercises, eq(exercises.id, templateExerciseAssignments.exerciseId))
    .where(eq(templateExerciseAssignments.dayId, dayId))
    .orderBy(asc(templateExerciseAssignments.position));

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Top-Right Delete Button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts" className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{routine.name}</h1>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{routine.muscleGroup}</p>
          </div>
        </div>

        {/* Delete Routine Form */}
        <form action={deleteFlexibleRoutineAction}>
          <input type="hidden" name="dayId" value={routine.id} />
          <input type="hidden" name="templateId" value={routine.templateId || ''} />
          <button 
            type="submit" 
            className="rounded-full bg-destructive/10 p-2 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Exercise List & Guided Empty State */}
      <div className="space-y-3">
        {assignments.length === 0 ? (
          <Card className="flex flex-col p-6 border-dashed border-2 border-primary/20 bg-primary/5 shadow-none space-y-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-black text-lg text-foreground">Build Your Routine</h3>
              <p className="text-xs text-muted-foreground mt-1">Follow these steps to set up your workout.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-primary/30 text-xs font-bold text-primary">1</span>
                <p className="text-sm text-foreground pt-0.5">Tap <strong className="text-primary">Add Exercise</strong> below to browse the library.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-primary/30 text-xs font-bold text-primary">2</span>
                <p className="text-sm text-foreground pt-0.5">Select the exercises you want to perform.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-primary/30 text-xs font-bold text-primary">3</span>
                <p className="text-sm text-foreground pt-0.5">Click <strong className="text-primary">Done & Save Routine</strong> when finished.</p>
              </div>
            </div>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="flex items-center gap-3 p-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <GripVertical className="h-5 w-5 shrink-0 text-muted/30 cursor-grab active:cursor-grabbing" />
              
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

      <div className="space-y-3 pt-4">
        <Link 
          href={`/workouts/${dayId}/edit/add-exercise`}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 text-sm font-black uppercase tracking-[0.18em] text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Exercise
        </Link>

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