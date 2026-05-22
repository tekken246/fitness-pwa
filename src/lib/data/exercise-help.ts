export function OCM_toExerciseSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export type ExerciseHelpData = {
  id: string;
  name: string;
  asset: string;
  assetAlt: string;
  targetMuscles: string[];
  setup: string[];
  execution: string[];
  avoid: string[];
};

export const OCM_EXERCISE_HELP: Record<string, ExerciseHelpData> = {
  'close-grip-bench-press': {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    asset: '/assets/exercises/close-grip-bench-press.webp',
    assetAlt: 'Close-Grip Bench Press start and active positions',
    targetMuscles: ['Triceps', 'Chest', 'Front Delts'],
    setup: [
      'Lie flat on the bench with feet planted.',
      'Grip the bar slightly narrower than shoulder width.',
      'Keep wrists stacked over elbows.',
    ],
    execution: [
      'Lower the bar under control toward the lower chest.',
      'Keep elbows tucked close to the torso.',
      'Press the bar up without locking out aggressively.',
    ],
    avoid: [
      'Do not flare elbows wide.',
      'Do not bounce the bar off the chest.',
      'Do not let wrists bend backward.',
    ],
  },
  'skull-crushers': {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    asset: '/assets/exercises/skull-crushers.webp',
    assetAlt: 'Skull Crushers start and active positions',
    targetMuscles: ['Triceps'],
    setup: [
      'Lie on a flat bench with arms extended above shoulders.',
      'Hold the bar or dumbbells with wrists neutral.',
      'Keep upper arms mostly fixed.',
    ],
    execution: [
      'Bend elbows to lower the weight toward the forehead or slightly behind the head.',
      'Extend elbows to return to the start position.',
      'Control the negative on every rep.',
    ],
    avoid: [
      'Do not let elbows drift outward.',
      'Do not move shoulders excessively.',
      'Do not use momentum.',
    ],
  },
  'flat-bench-press': {
    id: 'flat-bench-press',
    name: 'Flat Bench Press',
    asset: '/assets/exercises/flat-bench-press.webp',
    assetAlt: 'Flat Bench Press',
    targetMuscles: ['Chest', 'Front Delts', 'Triceps'],
    setup: [
      'Lie flat on the bench with eyes under the bar.',
      'Plant feet firmly on the floor.',
      'Grip the bar slightly wider than shoulder width.',
    ],
    execution: [
      'Unrack the bar and stabilize.',
      'Lower the bar to the mid-chest under control.',
      'Press forcefully back to the starting position.',
    ],
    avoid: [
      'Do not bounce the bar off your chest.',
      'Do not lift your hips off the bench.',
    ],
  },
  'cable-fly': {
    id: 'cable-fly',
    name: 'Cable Fly',
    asset: '/assets/exercises/cable-fly.webp',
    assetAlt: 'Cable Fly',
    targetMuscles: ['Chest'],
    setup: [
      'Set pulleys to chest height.',
      'Take a staggered stance for stability.',
      'Maintain a slight bend in the elbows.',
    ],
    execution: [
      'Bring the handles together in a hugging motion.',
      'Squeeze the chest at peak contraction.',
      'Slowly return to the start position.',
    ],
    avoid: [
      'Do not press the weight (keep the hugging motion).',
      'Do not let the weight pull your shoulders back too far.',
    ],
  }
};