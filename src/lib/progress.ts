import type { ExerciseProgressPoint, TrendDirection } from '@/lib/types';

export type CompletedSetMetric = {
  weight: number | null;
  reps: number | null;
};

/** Calculates Epley estimated one-rep max from weight and reps. */
export function calculateEstimatedOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return Math.round(weight * (1 + reps / 30) * 100) / 100;
}

/** Calculates total volume as sum of weight multiplied by reps. */
export function calculateVolume(sets: CompletedSetMetric[]): number {
  return sets.reduce((total, set) => {
    if (!set.weight || !set.reps) {
      return total;
    }

    return total + set.weight * set.reps;
  }, 0);
}

/** Returns the heaviest completed set weight. */
export function calculateBestSetWeight(sets: CompletedSetMetric[]): number {
  return sets.reduce((best, set) => {
    if (!set.weight || !set.reps) {
      return best;
    }

    return Math.max(best, set.weight);
  }, 0);
}

/** Returns the highest estimated one-rep max from completed sets. */
export function calculateBestEstimatedOneRepMax(sets: CompletedSetMetric[]): number {
  return sets.reduce((best, set) => {
    if (!set.weight || !set.reps) {
      return best;
    }

    return Math.max(best, calculateEstimatedOneRepMax(set.weight, set.reps));
  }, 0);
}

/** Compares latest exercise performance against the previous completed session. */
export function compareProgress(
  latest: ExerciseProgressPoint | null,
  previous: ExerciseProgressPoint | null,
): TrendDirection {
  if (!latest || !previous) {
    return 'neutral';
  }

  const latestScore = latest.estimatedOneRepMax || latest.volume;
  const previousScore = previous.estimatedOneRepMax || previous.volume;

  if (latestScore > previousScore) {
    return 'stronger';
  }

  if (latestScore < previousScore) {
    return 'weaker';
  }

  return 'neutral';
}

/** Returns true when the latest point is the best historical estimated one-rep max or volume. */
export function detectPersonalRecord(points: ExerciseProgressPoint[]): boolean {
  const latest = points.at(-1);

  if (!latest) {
    return false;
  }

  const previousPoints = points.slice(0, -1);
  const bestPreviousOneRepMax = Math.max(0, ...previousPoints.map((point) => point.estimatedOneRepMax));
  const bestPreviousVolume = Math.max(0, ...previousPoints.map((point) => point.volume));

  return latest.estimatedOneRepMax > bestPreviousOneRepMax || latest.volume > bestPreviousVolume;
}
