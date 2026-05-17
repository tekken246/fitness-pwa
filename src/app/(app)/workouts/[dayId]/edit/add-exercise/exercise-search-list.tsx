'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { addExerciseToRoutineAction } from '@/lib/actions/builder-actions';

type Exercise = {
  id: string;
  name: string;
  primaryMuscles: string[];
  equipment: string;
};

export function ExerciseSearchList({ exercises, dayId }: { exercises: Exercise[]; dayId: string }) {
  const [query, setQuery] = useState('');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  // Instant client-side filtering for PWA speed
  const filteredExercises = useMemo(() => {
    if (!query.trim()) return exercises;
    const lowerQuery = query.toLowerCase();
    
    return exercises.filter((ex) => 
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.primaryMuscles.some(m => m.toLowerCase().includes(lowerQuery)) ||
      ex.equipment.toLowerCase().includes(lowerQuery)
    );
  }, [query, exercises]);

  const handleAdd = async (exerciseId: string) => {
    if (isPending) return;
    setIsPending(true);
    
    try {
      const formData = new FormData();
      formData.append('dayId', dayId);
      formData.append('exerciseId', exerciseId);
      
      // Call the Server Action
      await addExerciseToRoutineAction(formData);
      
      // Navigate back to the builder automatically
      router.push(`/workouts/${dayId}/edit`);
    } catch (error) {
      console.error("Failed to add exercise", error);
    } finally {
      setIsPending(false);
    }
  };

  if (exercises.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
        <p className="text-sm font-bold">Exercise Library is Empty</p>
        <p className="text-xs text-muted mt-2">You need to seed the database with exercises before you can add them to a routine.</p>
      </Card>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 pb-20">
      {/* Search Input */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search by name, muscle, or equipment..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 w-full rounded-2xl border-2 border-border bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Filtered List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredExercises.length === 0 ? (
          <p className="text-center text-sm text-muted mt-8">No exercises match "{query}".</p>
        ) : (
            filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="flex items-center justify-between p-3 hover:border-primary/50 transition-colors">
                <Link href={`/exercises/${exercise.id}`} className="flex-1 pr-4">
                <h3 className="font-bold text-sm">{exercise.name}</h3>
                <p className="text-xs text-muted capitalize">
                    {exercise.primaryMuscles.join(', ') || 'Various'} • {exercise.equipment.replace('_', ' ')}
                </p>
                </Link>
                
                <button
                onClick={() => handleAdd(exercise.id)}
                disabled={isPending}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                >
                <Plus className="h-4 w-4" />
                </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}