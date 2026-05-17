import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Activity, Target } from 'lucide-react';
import type { ReactNode } from 'react';

import { db } from '@/db/client';
import { exercises } from '@/db/schema';
import { Card } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ exerciseId: string }>;
}

export default async function ExerciseDetailPage({ params }: PageProps): Promise<ReactNode> {
  const { exerciseId } = await params;

  // 1. Fetch the exact exercise
  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId));

  if (!exercise) notFound();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Uses next/navigation to go back to the previous screen (Search or Editor) */}
        <Link href="javascript:history.back()" className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{exercise.name}</h1>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted capitalize">
            {exercise.category} • {exercise.equipment.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Swipeable Image Carousel (CSS Scroll Snapping) */}
      {exercise.images && exercise.images.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {exercise.images.map((img, index) => (
              <div key={index} className="relative w-full shrink-0 snap-center bg-white flex items-center justify-center p-4">
                {/* We use standard img tags here to avoid requiring next.config.js external domain setup for the MVP */}
                <img 
                  src={img} 
                  alt={`${exercise.name} demonstration step ${index + 1}`}
                  className="max-h-64 object-contain rounded-md mix-blend-multiply" 
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute bottom-2 right-4 rounded-full bg-background/80 px-2 py-1 text-[10px] font-bold tracking-widest backdrop-blur-sm">
                  {index === 0 ? 'START' : 'FINISH'}
                </div>
              </div>
            ))}
          </div>
          {/* Carousel Indicators */}
          <div className="flex justify-center gap-1.5 py-3 bg-muted/30 border-t">
            {exercise.images.map((_, index) => (
              <div key={index} className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            ))}
          </div>
        </Card>
      )}

      {/* Anatomy & Target Muscles */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-muted flex items-center gap-2">
          <Target className="h-4 w-4" /> Anatomy
        </h2>
        <Card className="flex flex-wrap gap-2 p-4">
          {exercise.primaryMuscles.map((muscle) => (
            <span key={muscle} className="rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary capitalize">
              {muscle.replace('_', ' ')}
            </span>
          ))}
          {exercise.primaryMuscles.length === 0 && (
            <span className="text-sm text-muted">Multiple muscle groups</span>
          )}
        </Card>
      </section>

      {/* Step-by-Step Instructions */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.28em] text-muted flex items-center gap-2">
            <Activity className="h-4 w-4" /> Instructions
          </h2>
          <Card className="p-0 overflow-hidden">
            <ol className="divide-y divide-border">
              {exercise.instructions.map((step, index) => (
                <li key={index} className="flex items-start gap-4 p-4 text-sm leading-relaxed">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}
    </div>
  );
}