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

// Fallback dictionary for exercises missing from the external database
export const OCM_EXERCISE_HELP: Record<string, ExerciseHelpData> = {
  'flat-bench-press': {
    id: 'flat-bench-press',
    name: 'Flat Bench Press',
    asset: '/assets/exercises/flat-bench-press.webp',
    assetAlt: 'Flat Bench Press execution',
    targetMuscles: ['Chest', 'Front Delts', 'Triceps'],
    setup: [
      'Lie flat on the bench with eyes directly under the bar.',
      'Plant your feet firmly on the floor.',
      'Grip the bar slightly wider than shoulder-width.',
    ],
    execution: [
      'Unrack the bar and stabilize it over your chest.',
      'Lower the bar under control to your mid-chest.',
      'Press the bar up powerfully to the starting position.',
    ],
    avoid: [
      'Do not bounce the bar off your chest.',
      'Do not lift your hips off the bench.',
      'Do not flare your elbows at 90 degrees.',
    ],
  },
  'incline-dumbbell-press': {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    asset: '/assets/exercises/incline-dumbbell-press.webp',
    assetAlt: 'Incline Dumbbell Press execution',
    targetMuscles: ['Upper Chest', 'Front Delts', 'Triceps'],
    setup: [
      'Set an incline bench to 30-45 degrees.',
      'Kick the dumbbells up to your shoulders and lean back.',
      'Retract your shoulder blades and puff your chest out.',
    ],
    execution: [
      'Press the dumbbells straight up until your arms are fully extended.',
      'Lower the weights slowly until they are level with your upper chest.',
      'Keep your elbows tucked at a 45-degree angle.',
    ],
    avoid: [
      'Do not let the dumbbells drift over your face or stomach.',
      'Do not slam the dumbbells together at the top.',
    ],
  },
  'cable-fly': {
    id: 'cable-fly',
    name: 'Cable Fly',
    asset: '/assets/exercises/cable-fly.webp',
    assetAlt: 'Cable Fly execution',
    targetMuscles: ['Chest'],
    setup: [
      'Set pulleys to chest height.',
      'Grab handles, step forward, and take a staggered stance.',
      'Keep a slight bend in your elbows and a proud chest.',
    ],
    execution: [
      'Bring the handles together in a wide hugging motion.',
      'Squeeze your chest hard at peak contraction.',
      'Slowly reverse the motion until you feel a stretch in your pecs.',
    ],
    avoid: [
      'Do not press the weight; maintain the hugging arc.',
      'Do not let the weight pull your shoulders out of position.',
    ],
  },
  'pec-deck': {
    id: 'pec-deck',
    name: 'Pec Deck',
    asset: '/assets/exercises/pec-deck.webp',
    assetAlt: 'Pec Deck execution',
    targetMuscles: ['Chest', 'Inner Chest'],
    setup: [
      'Adjust the seat so the handles are at chest level.',
      'Keep your back flat against the pad and chest up.',
      'Grip the handles with a slight bend in your elbows.',
    ],
    execution: [
      'Bring the handles together in front of your chest.',
      'Hold the contraction for a split second.',
      'Slowly return to the starting position.',
    ],
    avoid: [
      'Do not use momentum to swing the weight.',
      'Do not let the weight stack rest between reps.',
    ],
  },
  'tricep-pushdown': {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    asset: '/assets/exercises/tricep-pushdown.webp',
    assetAlt: 'Tricep Pushdown execution',
    targetMuscles: ['Triceps'],
    setup: [
      'Attach a rope or straight bar to a high pulley.',
      'Grip the attachment and pin your elbows to your sides.',
      'Lean slightly forward with a braced core.',
    ],
    execution: [
      'Push the attachment down until your arms are fully extended.',
      'Flex your triceps hard at the bottom.',
      'Control the weight back up until your forearms are parallel to the floor.',
    ],
    avoid: [
      'Do not let your elbows drift forward or backward.',
      'Do not use your body weight to press the cable down.',
    ],
  }
};