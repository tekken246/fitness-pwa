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
  images: string[];
  targetMuscles: string[];
  setup: string[];
  execution: string[];
  avoid: string[];
};

// Maps missing exercises to the free GitHub cloud storage images
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
    setup: ['Set pulleys to a high position and grab a handle in each hand.', 'Step forward to create tension and stagger your stance.'],
    execution: ['Keeping a slight bend in your elbows, pull the handles down and together in a hugging motion.', 'Slowly reverse the motion until you feel a stretch in your chest.'],
    avoid: ['Do not bend your arms into a pressing motion.', 'Do not use momentum to swing the weight.']
  },
  'pec-deck': {
    id: 'pec-deck',
    name: 'Pec Deck',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly/1.jpg'
    ],
    targetMuscles: ['Chest'],
    setup: ['Sit on the machine with your back flat against the pad.', 'Grip the handles so your elbows are slightly below your shoulders.'],
    execution: ['Squeeze your chest to bring the pads/handles together in front of you.', 'Hold the contraction for a second, then return to the starting position.'],
    avoid: ['Do not let the weight slam back on the negative.', 'Do not use your shoulders to initiate the movement.']
  },
  'tricep-pushdown': {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    images: [
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg',
      'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/1.jpg'
    ],
    targetMuscles: ['Triceps'],
    setup: ['Attach a straight bar or rope to a high pulley.', 'Grip the attachment and brace your elbows against your sides.'],
    execution: ['Push the weight down until your arms are fully extended.', 'Squeeze your triceps at the bottom, then slowly return to a 90-degree angle.'],
    avoid: ['Do not let your elbows drift forward or backward.', 'Do not use your body weight to push the cable down.']
  }
};