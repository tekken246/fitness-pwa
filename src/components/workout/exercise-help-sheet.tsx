'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

type DynamicHelpProps = {
  name: string;
  images?: string[];
  instructions?: string[];
  primaryMuscles?: string[];
};

type ExerciseHelpSheetProps = {
  exerciseData: DynamicHelpProps | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ExerciseHelpSheet({ exerciseData, isOpen, onClose }: ExerciseHelpSheetProps): ReactNode {
  const [mounted, setMounted] = useState(false);

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

  if (!isOpen || !exerciseData || !mounted) return null;

  const content = (
    <div 
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
      role="presentation" 
      onClick={onClose}
    >
      <section
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[28px] border-t border-white/10 bg-[#0a0e1a] p-5 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom-8 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-5 sticky top-0 bg-[#0a0e1a] pt-1 pb-3 z-10">
          <h2 id="exercise-help-title" className="text-[22px] font-bold tracking-tight text-white leading-tight">
            {exerciseData.name}
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

        {/* Dynamic Images from GitHub Cloud Storage */}
        {exerciseData.images && exerciseData.images.length > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-[18px] bg-[#eef0f4] p-4 mb-6">
            {exerciseData.images.slice(0, 2).map((imgUrl, i) => (
              <img
                key={i}
                src={imgUrl}
                alt={`${exerciseData.name} posture ${i + 1}`}
                className="h-[120px] w-1/2 object-contain grayscale mix-blend-multiply"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ))}
          </div>
        )}

        <div className="space-y-6">
          {exerciseData.primaryMuscles && exerciseData.primaryMuscles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-blue-400">Target Muscles</h3>
              <div className="flex flex-wrap gap-2">
                {exerciseData.primaryMuscles.map((muscle) => (
                  <span key={muscle} className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[12px] font-semibold capitalize">
                    {muscle.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {exerciseData.instructions && exerciseData.instructions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#22C55E]">Execution</h3>
              <ol className="list-decimal pl-5 space-y-2 marker:text-white/30 marker:font-bold">
                {exerciseData.instructions.map((item, i) => (
                  <li key={i} className="text-[14px] text-white/80 leading-relaxed pl-1">{item}</li>
                ))}
              </ol>
            </div>
          )}
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