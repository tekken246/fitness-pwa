import { describe, expect, it } from 'vitest';

import {
  calculateBestEstimatedOneRepMax,
  calculateBestSetWeight,
  calculateEstimatedOneRepMax,
  calculateVolume,
  compareProgress,
  detectPersonalRecord,
} from '@/lib/progress';

describe('progress calculations', () => {
  it('calculates Epley estimated one-rep max', () => {
    expect(calculateEstimatedOneRepMax(100, 10)).toBe(133.33);
  });

  it('calculates volume and best set metrics', () => {
    const sets = [
      { weight: 100, reps: 10 },
      { weight: 120, reps: 8 },
      { weight: null, reps: 8 },
    ];

    expect(calculateVolume(sets)).toBe(1960);
    expect(calculateBestSetWeight(sets)).toBe(120);
    expect(calculateBestEstimatedOneRepMax(sets)).toBe(152);
  });

  it('compares latest and previous completed sessions', () => {
    const previous = { localDate: '2026-05-01', volume: 1000, bestWeight: 100, estimatedOneRepMax: 120, totalReps: 20 };
    const latest = { localDate: '2026-05-08', volume: 1100, bestWeight: 105, estimatedOneRepMax: 130, totalReps: 22 };

    expect(compareProgress(latest, previous)).toBe('stronger');
  });

  it('detects personal records from latest point', () => {
    const points = [
      { localDate: '2026-05-01', volume: 1000, bestWeight: 100, estimatedOneRepMax: 120, totalReps: 20 },
      { localDate: '2026-05-08', volume: 1200, bestWeight: 100, estimatedOneRepMax: 125, totalReps: 22 },
    ];

    expect(detectPersonalRecord(points)).toBe(true);
  });
});
