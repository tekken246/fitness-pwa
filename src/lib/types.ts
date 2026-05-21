export type UnitPreference = 'lb' | 'kg';
export type ThemePreference = 'light' | 'dark' | 'rose';
export type SessionStatus = 'active' | 'completed';
export type TrendDirection = 'stronger' | 'weaker' | 'neutral';

export type UserSettings = {
  clerkUserId: string;
  unit: UnitPreference;
  theme: ThemePreference;
  timezone: string;
};

export type WorkoutDaySummary = {
  id: string;
  dayOfWeek: number | null;
  displayOrder: number;
  name: string;
  muscleGroup: string;
  isRestDay: boolean;
  isOptional: boolean;
  exercises: string[];
};

export type TemplateExercise = {
  assignmentId: string;
  exerciseId: string;
  alternativeExerciseId: string | null;
  displayName: string;
  position: number;
  targetReps: number[];
  sets: number;
  targetType: string;
  targetNote: string | null;
  measurementType: string;
  defaultUnit: UnitPreference | 'none';
  perSide: boolean;
  isOptional: boolean;
};

export type SetEntryView = {
  id: string;
  position: number;
  targetReps: number | null;
  targetLabel: string;
  weight: number | null;
  reps: number | null;
  unit: UnitPreference | 'none';
  rpe: number | null;
  completed: boolean;
  completedAt?: string | null; // <--- ADDED THIS TO FIX THE BUILD ERROR
};

export type PreviousPerformance = {
  weight: number;
  reps: number;
  unit: UnitPreference | 'none';
  localDate: string;
};

export type WorkoutExerciseEntryView = {
  id: string;
  assignmentId: string;
  exerciseId: string;
  selectedExerciseId: string;
  displayName: string;
  position: number;
  targetNote: string | null;
  measurementType: string;
  defaultUnit: UnitPreference | 'none';
  perSide: boolean;
  notes: string;
  previousPerformance: PreviousPerformance | null;
  sets: SetEntryView[];
};

export type WorkoutSessionView = {
  id: string;
  localDate: string;
  timezone: string;
  status: SessionStatus;
  startedAt: Date; 
  notes: string;
  day: {
    id: string;
    name: string;
    muscleGroup: string;
    isRestDay: boolean;
    isOptional: boolean;
  };
  exercises: WorkoutExerciseEntryView[];
};

export type SetDraft = {
  setEntryId: string;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
};

export type WorkoutDraft = {
  sessionId: string;
  exerciseNotes: Record<string, string>;
  sessionNotes: string;
  sets: SetDraft[];
  updatedAt: string;
};

export type ExerciseProgressPoint = {
  localDate: string;
  volume: number;
  bestWeight: number;
  estimatedOneRepMax: number;
  totalReps: number;
};

export type ExerciseProgressSummary = {
  exerciseId: string;
  exerciseName: string;
  latest: ExerciseProgressPoint | null;
  previous: ExerciseProgressPoint | null;
  trend: TrendDirection;
  personalRecord: boolean;
  points: ExerciseProgressPoint[];
};