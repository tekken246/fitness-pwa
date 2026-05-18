import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, GripVertical, Plus, Check, Dumbbell } from 'lucide-react';

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
    <div className="space-y-6 pb-28">
      {/* Premium Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <Link href="/workouts" className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{routine.name}</h1>
            <p className="text-[13px] font-semibold text-primary">{routine.muscleGroup}</p>
          </div>
        </div>

        <form action={deleteFlexibleRoutineAction}>
          <input type="hidden" name="dayId" value={routine.id} />
          <input type="hidden" name="templateId" value={routine.templateId || ''} />
          <button 
            type="submit" 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Exercise List */}
      <div className="space-y-2.5">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Dumbbell className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Build Your Routine</h3>
            <p className="text-sm font-medium text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              Tap the button below to browse the library and add your first exercise.
            </p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="group flex items-center gap-3 rounded-2xl border-border/40 p-3 shadow-sm transition-all hover:border-primary/30">
              <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
              
              {assignment.images && assignment.images[0] ? (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-white p-1.5 shadow-sm border border-border/20">
                  <img 
                    src={assignment.images[0]} 
                    alt={assignment.displayName} 
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-muted/40 flex items-center justify-center border border-border/40">
                  <Dumbbell className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold truncate leading-tight text-foreground">{assignment.displayName}</h3>
                <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                  {assignment.sets} sets • {assignment.targetReps[0]} reps
                </p>
              </div>

              <form action={removeExerciseFromRoutineAction}>
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <input type="hidden" name="dayId" value={dayId} />
                <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </Card>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-6">
        <Link 
          href={`/workouts/${dayId}/edit/add-exercise`}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add Exercise
        </Link>

        {assignments.length > 0 && (
          <Link 
            href="/workouts"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-bold text-background hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
          >
            <Check className="h-5 w-5" />
            Done & Save Routine
          </Link>
        )}
      </div>
    </div>
  );
}