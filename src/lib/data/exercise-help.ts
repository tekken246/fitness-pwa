// src/lib/data/exercise-help.ts

export type ExerciseHelpData = {
  id: string;
  name: string;
  images: string[];
  targetMuscles: string[];
  setup: string[];
  execution: string[];
  avoid: string[];
};

/**
 * Converts a standard exercise name into a strict slug.
 */
export function OCM_toExerciseSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Smart Keyword Matcher: Tries an exact match first, then falls back
 * to fuzzy keyword matching to ensure users always get a helpful image.
 */
export function getExerciseFallback(displayName: string): ExerciseHelpData | null {
  if (!displayName) return null;
  
  const slug = OCM_toExerciseSlug(displayName);

  // 1. Try exact slug match first
  if (OCM_EXERCISE_HELP[slug]) {
    return OCM_EXERCISE_HELP[slug];
  }

  // 2. Smart Keyword Matching (Fuzzy Match)
  const nameStr = displayName.toLowerCase();

  // Chest / Push movements
  if (nameStr.includes('bench press') || nameStr.includes('chest press')) {
    if (nameStr.includes('incline')) return OCM_EXERCISE_HELP['incline-dumbbell-press'];
    return OCM_EXERCISE_HELP['flat-bench-press'];
  }
  if (nameStr.includes('fly') || nameStr.includes('pec deck') || nameStr.includes('butterfly') || nameStr.includes('crossover')) {
    return OCM_EXERCISE_HELP['cable-fly'];
  }
  if (nameStr.includes('pushdown') || nameStr.includes('tricep')) {
    return OCM_EXERCISE_HELP['tricep-pushdown'];
  }

  // Leg movements
  if (nameStr.includes('squat')) return OCM_EXERCISE_HELP['barbell-squat'];
  if (nameStr.includes('deadlift')) return OCM_EXERCISE_HELP['deadlift'];
  if (nameStr.includes('leg press')) return OCM_EXERCISE_HELP['leg-press'];
  if (nameStr.includes('extension')) return OCM_EXERCISE_HELP['leg-extension'];
  if (nameStr.includes('curl') && nameStr.includes('leg')) return OCM_EXERCISE_HELP['leg-curl'];

  // Back / Pull movements
  if (nameStr.includes('pullup') || nameStr.includes('pull-up') || nameStr.includes('pulldown')) {
    return OCM_EXERCISE_HELP['lat-pulldown'];
  }
  if (nameStr.includes('row')) return OCM_EXERCISE_HELP['barbell-row'];

  // Bicep movements
  if (nameStr.includes('curl') && (nameStr.includes('bicep') || nameStr.includes('dumbbell') || nameStr.includes('barbell'))) {
    return OCM_EXERCISE_HELP['bicep-curl'];
  }

  // Shoulder movements
  if (nameStr.includes('lateral raise') || nameStr.includes('side raise')) return OCM_EXERCISE_HELP['lateral-raise'];
  if (nameStr.includes('shoulder press') || nameStr.includes('overhead press')) return OCM_EXERCISE_HELP['overhead-press'];

  // If absolutely no keywords match, safely return null
  return null;
}

/**
 * Exercise Dictionary
 * Uses images sourced from the free-exercise-db repository.
 */
export const OCM_EXERCISE_HELP: Record<string, ExerciseHelpData> = {
  'flat-bench-press': {
    id: 'flat-bench-press',
    name: 'Flat Bench Press',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/1.jpg'
    ],
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    setup: ['Lie flat on the bench with feet firmly planted on the ground.', 'Grip the bar slightly wider than shoulder-width.'],
    execution: ['Unrack the bar and slowly lower it to your mid-chest.', 'Press the bar back up explosively to the starting position.'],
    avoid: ['Do not bounce the bar off your chest.', 'Do not lift your hips off the bench.']
  },
  'incline-dumbbell-press': {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Press/1.jpg'
    ],
    targetMuscles: ['Upper Chest', 'Front Delts', 'Triceps'],
    setup: ['Set bench to a 30-45 degree incline.', 'Kick the dumbbells up to your shoulders and lean back.'],
    execution: ['Lower the dumbbells under control until they reach chest level.', 'Press them back up, converging slightly at the top.'],
    avoid: ['Do not flare your elbows 90 degrees out.', 'Do not arch your lower back excessively.']
  },
  'cable-fly': {
    id: 'cable-fly',
    name: 'Cable Fly',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cable_Crossover/1.jpg'
    ],
    targetMuscles: ['Chest'],
    setup: ['Set pulleys to a high position and grab a handle in each hand.'],
    execution: ['Keeping a slight bend in your elbows, pull the handles down and together in a hugging motion.'],
    avoid: ['Do not bend your arms into a pressing motion.']
  },
  'tricep-pushdown': {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/1.jpg'
    ],
    targetMuscles: ['Triceps'],
    setup: ['Attach a straight bar or rope to a high pulley.'],
    execution: ['Push the weight down until your arms are fully extended.'],
    avoid: ['Do not let your elbows drift forward or backward.']
  },
  'barbell-squat': {
    id: 'barbell-squat',
    name: 'Barbell Squat',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/1.jpg'
    ],
    targetMuscles: ['Quads', 'Glutes', 'Hamstrings'],
    setup: ['Rest the barbell on your upper traps or rear delts.', 'Stand with feet shoulder-width apart, toes pointed slightly out.'],
    execution: ['Brace your core and sit back/down as if sitting in a chair.', 'Drive through your heels to return to the starting position.'],
    avoid: ['Do not let your knees cave inward.', 'Do not let your lower back round excessively.']
  },
  'deadlift': {
    id: 'deadlift',
    name: 'Deadlift',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/1.jpg'
    ],
    targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    setup: ['Stand with feet hip-width apart, barbell over mid-foot.', 'Hinge at the hips and grab the bar just outside your legs.'],
    execution: ['Keep your chest up and back flat. Drive through your legs to lift the weight.', 'Extend hips and knees simultaneously.'],
    avoid: ['Do not round your lower back.', 'Do not pull with your arms.']
  },
  'lat-pulldown': {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/1.jpg'
    ],
    targetMuscles: ['Lats', 'Biceps', 'Rear Delts'],
    setup: ['Adjust the knee pad so you are locked in securely.', 'Grip the bar slightly wider than shoulder-width.'],
    execution: ['Pull the bar down to your upper chest, squeezing your shoulder blades together.', 'Slowly return the bar to the top.'],
    avoid: ['Do not lean too far back or use momentum to swing the weight.']
  },
  'barbell-row': {
    id: 'barbell-row',
    name: 'Barbell Row',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/1.jpg'
    ],
    targetMuscles: ['Lats', 'Rhomboids', 'Traps'],
    setup: ['Hinge at the hips until your torso is nearly parallel to the floor.', 'Keep your back straight and core braced.'],
    execution: ['Pull the barbell to your lower chest/upper stomach.', 'Lower it under control.'],
    avoid: ['Do not jerk the weight up by extending your lower back.']
  }
};