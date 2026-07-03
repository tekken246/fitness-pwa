'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Plus, X } from 'lucide-react';

import { createFlexibleRoutineAction } from '@/lib/actions/routine-actions';

export function CreateRoutineButton(): ReactNode {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-[#22C55E]/30 bg-[#22C55E]/[0.1] text-[14px] font-semibold text-[#22C55E] transition-colors hover:bg-[#22C55E]/[0.16]"
      >
        <Plus className="h-4 w-4" /> New routine
      </button>
    );
  }

  return (
    <section className="rounded-[20px] border border-white/[0.08] bg-white/[0.05] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-white">New routine</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cancel" className="text-white/40 transition-colors hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <form action={createFlexibleRoutineAction} className="flex flex-col gap-2">
        <input
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="Name (e.g. Push Day)"
          className="h-11 w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-3 text-[14px] text-white transition-colors placeholder:text-white/30 focus:border-[#22C55E]/50 focus:outline-none"
        />
        <input
          name="muscleGroup"
          type="text"
          required
          maxLength={80}
          placeholder="Muscles (e.g. Chest, Triceps)"
          className="h-11 w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-3 text-[14px] text-white transition-colors placeholder:text-white/30 focus:border-[#22C55E]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="mt-1 h-11 w-full rounded-[14px] bg-[#22C55E] text-[14px] font-semibold text-black transition-opacity hover:opacity-90"
        >
          Create &amp; add exercises
        </button>
      </form>
    </section>
  );
}
