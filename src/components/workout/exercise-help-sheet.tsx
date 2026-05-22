'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

import type { ExerciseHelpData } from '@/lib/data/exercise-help';

type ExerciseHelpSheetProps = {
  exerciseHelp: ExerciseHelpData | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ExerciseHelpSheet({ exerciseHelp, isOpen, onClose }: ExerciseHelpSheetProps): ReactNode {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by mounting portal only on client
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !exerciseHelp || !mounted) return null;

  const content = (
    <div 
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
      role="presentation" 
      onClick={onClose}
    >
      <section
        className="w-full max-w-md max-h-[78vh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#0a0e1a] p-5 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom-8 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-help-title"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          <h2 id="exercise-help-title" className="text-[22px] font-bold tracking-tight text-white leading-tight">
            {exerciseHelp.name}
          </h2>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/50 hover:bg-white/[0.1] hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close exercise help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media Wrapper - Light bg as requested since images are b&w */}
        <div className="flex items-center justify-center rounded-[18px] bg-[#eef0f4] p-4 mb-6">
          <img
            src={exerciseHelp.asset}
            alt={exerciseHelp.assetAlt}
            className="h-[120px] w-auto object-contain grayscale mix-blend-multiply"
            loading="lazy"
            onError={(e) => {
              // Fallback if image doesn't exist yet
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#22C55E]">Setup</h3>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-white/30">
              {exerciseHelp.setup.map((item) => (
                <li key={item} className="text-[14px] text-white/80 leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#22C55E]">Execution</h3>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-white/30">
              {exerciseHelp.execution.map((item) => (
                <li key={item} className="text-[14px] text-white/80 leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-blue-400">Targets</h3>
            <p className="text-[14px] text-white/80 leading-relaxed font-medium">
              {exerciseHelp.targetMuscles.join(', ')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-red-400">Avoid</h3>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-red-400/50">
              {exerciseHelp.avoid.map((item) => (
                <li key={item} className="text-[14px] text-white/80 leading-relaxed">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}

export function ExerciseHelpButton({ onClick, exerciseName }: { onClick: () => void; exerciseName: string }) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.05] text-[#22C55E] hover:bg-white/[0.08] active:scale-95 transition-all shadow-sm"
      onClick={onClick}
      aria-label={`View help for ${exerciseName}`}
    >
      <Info className="h-4 w-4" />
    </button>
  );
}