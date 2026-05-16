'use client';

import { useEffect } from 'react';

import { syncWorkoutDraftAction } from '@/lib/actions/workout-actions';
import { canUseDraftStore, clearWorkoutDraft, loadWorkoutDraft, saveWorkoutDraft } from '@/lib/client/workout-draft-store';
import type { WorkoutDraft, WorkoutExerciseEntryView } from '@/lib/types';
import { buildWorkoutDraft } from '@/components/workout/workout-draft-state';

type UseWorkoutDraftSyncProps = {
  sessionId: string;
  sessionNotes: string;
  exercises: WorkoutExerciseEntryView[];
  onDraftLoaded: (draft: WorkoutDraft) => void;
  onError: (message: string | null) => void;
};

/** Persists workout state locally and syncs it when the browser is online. */
export function useWorkoutDraftSync({
  sessionId,
  sessionNotes,
  exercises,
  onDraftLoaded,
  onError,
}: UseWorkoutDraftSyncProps): void {
  useEffect(() => {
    if (!canUseDraftStore()) {
      return;
    }

    loadWorkoutDraft(sessionId).then((draft) => {
      if (draft) {
        onDraftLoaded(draft);
      }
    }).catch(() => undefined);
  }, [onDraftLoaded, sessionId]);

  useEffect(() => {
    const draft = buildWorkoutDraft(sessionId, sessionNotes, exercises);
    const timeoutId = window.setTimeout(() => {
      if (canUseDraftStore()) {
        void saveWorkoutDraft(draft);
      }

      if (navigator.onLine) {
        syncWorkoutDraftAction(draft).then((result) => {
          if (!result.ok) {
            onError(result.error);
            return;
          }

          onError(null);
          void clearWorkoutDraft(sessionId);
        });
      }
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [exercises, onError, sessionId, sessionNotes]);

  useEffect(() => {
    const sync = (): void => {
      if (!canUseDraftStore()) {
        return;
      }

      loadWorkoutDraft(sessionId).then((draft) => {
        if (!draft) {
          return;
        }

        syncWorkoutDraftAction(draft).then((result) => {
          if (result.ok) {
            void clearWorkoutDraft(sessionId);
          }
        });
      }).catch(() => undefined);
    };

    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sessionId]);
}
