'use client';

import { useRouter } from 'next/navigation';
import { Dumbbell } from 'lucide-react';

export function ExerciseSelector({
  exercises,
  currentExercise
}: {
  exercises: { id: string; name: string }[];
  currentExercise: string;
}) {
  const router = useRouter();

  return (
    <div className="relative flex items-center">
      <Dumbbell className="absolute left-4 h-5 w-5 text-white/40 pointer-events-none" />
      <select
        value={currentExercise}
        onChange={(e) => router.push(`/progress?exercise=${encodeURIComponent(e.target.value)}`)}
        className="h-[52px] w-full rounded-[16px] border border-white/[0.08] bg-[#121829] pl-12 pr-4 text-[15px] font-semibold text-white focus:border-[#22C55E]/50 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22rgba%28255,255,255,0.4%29%22%3E%3Cpath%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%3E%3C/path%3E%3C/svg%3E')] bg-[length:18px_18px] bg-[right_16px_center] bg-no-repeat"
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.name} className="bg-[#0a0e1a]">
            {ex.name}
          </option>
        ))}
        {exercises.length === 0 && (
          <option value="Flat Bench Press">Flat Bench Press (Seed Core)</option>
        )}
      </select>
    </div>
  );
}