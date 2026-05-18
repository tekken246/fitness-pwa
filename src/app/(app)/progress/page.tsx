import type { ReactNode } from 'react';
import { Search, ChevronDown, TrendingUp, Trophy, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default async function ProgressPage(): Promise<ReactNode> {
  return (
    <div className="space-y-6 pb-28 text-white">
      
      <div className="px-1 pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-white">Progress</h1>
      </div>

      {/* PR1: Weekly Summary (Level 2) */}
      <Card className="rounded-[20px] border-white/10 bg-white/[0.07] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22C55E]">This Week</p>
            <h2 className="mt-1 text-[24px] font-bold tracking-tight text-white">12,450 <span className="text-[15px] text-white/50">lb volume</span></h2>
            <p className="text-[13px] font-medium text-white/60 mt-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> 3 workouts completed
            </p>
          </div>
          {/* Mock Sparkline Box */}
          <div className="flex h-12 w-20 items-end gap-1 opacity-60">
            <div className="w-full bg-[#22C55E] h-[40%] rounded-t-sm" />
            <div className="w-full bg-[#22C55E] h-[60%] rounded-t-sm" />
            <div className="w-full bg-[#22C55E] h-[100%] rounded-t-sm" />
          </div>
        </div>
      </Card>

      {/* PR2: Exercise Selector */}
      <div className="px-1">
        <button className="flex h-[52px] w-full items-center justify-between rounded-[16px] border border-white/[0.08] bg-white/[0.05] px-4 hover:bg-white/[0.08] transition-colors">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-white/40" />
            <span className="text-[15px] font-semibold text-white">Flat Bench Press</span>
          </div>
          <ChevronDown className="h-5 w-5 text-white/40" />
        </button>
      </div>

      {/* PR4: Trend Badge (Replaces "NEUTRAL") */}
      <div className="px-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 px-3 py-1.5 border border-[#22C55E]/30 text-[#22C55E]">
          <TrendingUp className="h-4 w-4" />
          <span className="text-[13px] font-semibold">Improving</span>
        </div>
      </div>

      {/* PR3: Stat Cards Row */}
      <div className="grid grid-cols-3 gap-2 px-1">
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-white/[0.08] bg-white/[0.05] p-4 text-center">
          <p className="text-[20px] font-bold text-white">740<span className="text-[11px] text-white/50 ml-0.5">lb</span></p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Volume</p>
        </Card>
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-white/[0.08] bg-white/[0.05] p-4 text-center">
          <p className="text-[20px] font-bold text-white">40<span className="text-[11px] text-white/50 ml-0.5">lb</span></p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">Best</p>
        </Card>
        <Card className="flex flex-col items-center justify-center rounded-[16px] border-[#22C55E]/20 bg-[#22C55E]/5 p-4 text-center">
          <p className="text-[20px] font-bold text-[#22C55E]">45.3<span className="text-[11px] text-[#22C55E]/60 ml-0.5">lb</span></p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#22C55E]/60">E1RM</p>
        </Card>
      </div>

      {/* PR5: Chart Area Placeholder */}
      <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.03] p-5">
        <h3 className="text-[13px] font-semibold text-white/70 mb-4">Estimated 1RM Trend</h3>
        <div className="flex h-[150px] w-full items-center justify-center rounded-[12px] border border-dashed border-white/10 bg-white/[0.02]">
           {/* In a real app, Recharts/Chart.js would go here */}
           <p className="text-[13px] text-white/30 px-6 text-center">Log more sessions with Flat Bench Press to see your progress chart.</p>
        </div>
      </Card>

      {/* PR6: Personal Records */}
      <div className="space-y-3 px-1 pt-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#22C55E]" />
          <h3 className="text-[17px] font-semibold tracking-tight text-white">Personal Records</h3>
        </div>
        
        <Card className="rounded-[20px] border-white/[0.08] bg-white/[0.05] p-0 overflow-hidden divide-y divide-white/[0.06]">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-[13px] text-white/50">Best Weight</p>
              <p className="text-[11px] text-white/30 mt-0.5">May 18, 2026</p>
            </div>
            <p className="text-[17px] font-bold text-white">200 <span className="text-[13px] text-white/50 font-medium">lb</span></p>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-[13px] text-white/50">Best Volume</p>
              <p className="text-[11px] text-white/30 mt-0.5">May 18, 2026</p>
            </div>
            <p className="text-[17px] font-bold text-white">4,250 <span className="text-[13px] text-white/50 font-medium">lb</span></p>
          </div>
        </Card>
      </div>
      
    </div>
  );
}