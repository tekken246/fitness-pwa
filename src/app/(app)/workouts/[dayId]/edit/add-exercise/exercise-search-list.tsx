'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { addExerciseToRoutineAction } from '@/lib/actions/builder-actions';

// 1. Added category to the type so we can read the seed data
type Exercise = {
  id: string;
  name: string;
  category: string; 
  primaryMuscles: string[];
  equipment: string;
};

const MUSCLE_FILTERS = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

export function ExerciseSearchList({ exercises, dayId }: { exercises: Exercise[]; dayId: string }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Helper: Check if a muscle matches the old 'category' OR the new 'primaryMuscles' array
      const checkMuscle = (target: string) => 
        (ex.category && ex.category.toLowerCase() === target) || 
        (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase() === target));

      // Search Text Match
      const lowerQuery = query.toLowerCase();
      const matchesQuery = !query.trim() || 
        ex.name.toLowerCase().includes(lowerQuery) ||
        (ex.category && ex.category.toLowerCase().includes(lowerQuery)) ||
        (ex.primaryMuscles && ex.primaryMuscles.some(m => m.toLowerCase().includes(lowerQuery))) ||
        (ex.equipment && ex.equipment.toLowerCase().includes(lowerQuery));

      // Bubble Filter Match
      let matchesFilter = true;
      if (activeFilter !== 'All') {
        const target = activeFilter.toLowerCase();
        
        if (target === 'arms') {
          matchesFilter = checkMuscle('biceps') || checkMuscle('triceps');
        } else if (target === 'core') {
          matchesFilter = checkMuscle('abs') || checkMuscle('core');
        } else {
          matchesFilter = checkMuscle(target);
        }
      }

      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter, exercises]);

  const handleAdd = async (exerciseId: string) => {
    if (isPending) return;
    setIsPending(true);
    
    try {
      const formData = new FormData();
      formData.append('dayId', dayId);
      formData.append('exerciseId', exerciseId);
      
      await addExerciseToRoutineAction(formData);
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

      {/* Horizontal Filter Bubbles */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {MUSCLE_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`snap-start shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all border ${
              activeFilter === filter
                // 2. FIXED CONTRAST: Switched to text-background so text is dark against the bright primary color
                ? 'bg-primary text-background border-primary shadow-sm' 
                : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/80'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Filtered List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filteredExercises.length === 0 ? (
          <p className="text-center text-sm text-muted mt-8">No exercises match your filters.</p>
        ) : (
            filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="flex items-center justify-between p-3 hover:border-primary/50 transition-colors">
                <Link href={`/exercises/${exercise.id}`} className="flex-1 pr-4">
                <h3 className="font-bold text-sm">{exercise.name}</h3>
                <p className="text-xs text-muted capitalize">
                    {/* Graceful fallback if muscles array is empty */}
                    {(exercise.primaryMuscles && exercise.primaryMuscles.length > 0) ? exercise.primaryMuscles.join(', ') : exercise.category} • {exercise.equipment ? exercise.equipment.replace('_', ' ') : 'Various'}
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