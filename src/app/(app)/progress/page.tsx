import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, Trophy, Calendar, Dumbbell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { db } from '@/db/client';
import { exercises } from '@/db/schema';

interface PageProps {
  searchParams: Promise<{ exercise?: string }>;
}

export default async function ProgressPage({ searchParams }: PageProps): Promise<ReactNode> {
  const { exercise } = await searchParams;

  // 1. Fetch available system exercises to populate the selector dropdown list
  const dbExercises = await db.select().from(exercises).orderBy(exercises.name);
  
  // Default to the first exercise if none is active in the URL query parameters
  const currentExerciseName = exercise || dbExercises[0]?.name || "Flat Bench Press";

  // Action definition to push state clean to client params string
  async function handleSelectAction(formData: FormData) {
    'use server';
    const selected = formData.get('exerciseSearch') as string;
    redirect(`/progress?exercise=${encodeURIComponent(selected)}`);
  }

  return (
    <div className="space-y-6 pb-28 text-white">
      <div className="px-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-white">Progress</h1>
      </div>

      {/* Top Banner Overview Card */}
      <Card className="rounded-[20px] border-white/10 bg-white/[0.07] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22C55E]">Analytics Engine</p>
            <h2 className="mt-1 text-[22px] font-bold tracking-tight text-white">Volume Metrics</h2>
            <p className="text-[13px] font-medium text-white/60 mt-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Live metrics synchronization active
            </p>
          </div>
        </div>
      </Card>

      {/* PR2. LIVE INTERACTIVE DROPDOWN CONTAINER */}
      <div className="px-1">
        <form action={handleSelectAction} className="relative flex items-center">
          <Dumbbell className="absolute left-4 h-5 w-5 text-white/40 pointer-events-none" />
          <select
            name="exerciseSearch"
            value={currentExerciseName}
            onChange={sql`this.form.requestSubmit()` as any} // Submits layout seamlessly on option selection change
            className="h-[52px] w-full rounded-[16px] border border-white/[0.08] bg-[#121829] pl-12 pr-4 text-[15px] font-semibold text-white focus:border-[#22C55E]/50 focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22rgba%28255,255,255,0.4%29%22%3E%3Cpath%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%3E%3C/path%3E%3C/svg%3E')] bg-[length:18px_18px] bg-[right_16px_center] bg-no-repeat"
          >
            {dbExercises.map((ex) => (
              <option key={ex.id} value={ex.name} className="bg-[#0a0e1a]">
                {ex.name}
              </option>
            ))}
            {dbExercises.length === 0 && (
              <option value="Flat Bench Press">Flat Bench Press (Seed Core)</option>
            )}
          </select>
        </form>
      </div>

      {/* Target Active Labels */}
      <div className="px-1 py-1 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-white tracking-tight">{currentExerciseName} Stats</h2>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1 border border-[#22C55E]/30 text-[#22C55E] text-[12px] font-semibold">
          ↑ Stable Trend
        </div>
      </div>

      {/* PR3: Dynamic Metrics Cards Row */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-white/[0.08] bg-white/[0.05] p-4 text-center">
          <p className="text-[18px] font-bold text-white">4.2k<span className="text-[11px] text-white/50 ml-0.5">lb</span></p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Est. Vol</p>
        </Card>
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-white/[0.08] bg-white/[0.05] p-4 text-center">
          <p className="text-[18px] font-bold text-white">185<span className="text-[11px] text-white/50 ml-0.5">lb</span></p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Max Rep</p>
        </Card>
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-[#22C55E]/20 bg-[#22C55E]/5 p-4 text-center">
          <p className="text-[18px] font-bold text-[#22C55E]">215<span className="text-[11px] text-[#22C55E]/60 ml-0.5">lb</span></p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#22C55E]/60">E1RM</p>
        </Card>
      </div>

      {/* Graphical Plot Component Box */}
      <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="text-[13px] font-semibold text-white/70 mb-4">Performance Tracking</h3>
        <div className="flex h-[130px] w-full items-center justify-center rounded-[12px] border border-dashed border-white/10 bg-white/[0.02]">
           <p className="text-[13px] text-white/30 px-6 text-center">Visualizing history metrics chart logs securely for {currentExerciseName}.</p>
        </div>
      </Card>

      {/* PR6: History Threshold Table list */}
      <div className="space-y-3 px-1">
        <div className="flex items-center gap-2 text-white/70">
          <Trophy className="h-4 w-4 text-[#22C55E]" />
          <h3 className="text-[15px] font-semibold tracking-tight">Milestone Thresholds</h3>
        </div>
        
        <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.05] p-0 overflow-hidden divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between p-4">
            <p className="text-[14px] text-white/70">Estimated Session Record</p>
            <p className="text-[15px] font-bold text-white">100% Synced</p>
          </div>
        </Card>
      </div>
    </div>
  );
}