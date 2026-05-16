import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const userSettings = pgTable('user_settings', {
  clerkUserId: text('clerk_user_id').primaryKey(),
  unit: text('unit').notNull().default('lb'),
  theme: text('theme').notNull().default('dark'),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workoutTemplates = pgTable(
  'workout_templates',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    version: integer('version').notNull(),
    source: text('source').notNull(),
    isSeed: boolean('is_seed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameVersion: uniqueIndex('uq_workout_templates_name_version').on(table.name, table.version),
  }),
);

export const workoutTemplateDays = pgTable(
  'workout_template_days',
  {
    id: text('id').primaryKey(),
    templateId: text('template_id')
      .notNull()
      .references(() => workoutTemplates.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    displayOrder: integer('display_order').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    muscleGroup: text('muscle_group').notNull(),
    isRestDay: boolean('is_rest_day').notNull().default(false),
    isOptional: boolean('is_optional').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    templateDay: uniqueIndex('uq_workout_template_days_template_day').on(table.templateId, table.dayOfWeek),
    templateSlug: uniqueIndex('uq_workout_template_days_template_slug').on(table.templateId, table.slug),
  }),
);

export const exercises = pgTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category').notNull(),
  measurementType: text('measurement_type').notNull(),
  defaultUnit: text('default_unit').notNull().default('lb'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const templateExerciseAssignments = pgTable(
  'template_exercise_assignments',
  {
    id: text('id').primaryKey(),
    dayId: text('day_id')
      .notNull()
      .references(() => workoutTemplateDays.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    alternativeExerciseId: text('alternative_exercise_id').references(() => exercises.id),
    displayName: text('display_name').notNull(),
    position: integer('position').notNull(),
    targetReps: integer('target_reps').array().notNull().default([]),
    sets: integer('sets').notNull(),
    targetType: text('target_type').notNull(),
    targetNote: text('target_note'),
    perSide: boolean('per_side').notNull().default(false),
    isOptional: boolean('is_optional').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dayPosition: uniqueIndex('uq_template_exercise_assignments_day_position').on(table.dayId, table.position),
  }),
);

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: text('id').primaryKey(),
    clerkUserId: text('clerk_user_id').notNull(),
    templateDayId: text('template_day_id')
      .notNull()
      .references(() => workoutTemplateDays.id),
    localDate: date('local_date').notNull(),
    timezone: text('timezone').notNull(),
    status: text('status').notNull().default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userDate: index('idx_workout_sessions_user_date').on(table.clerkUserId, table.localDate),
    userStatus: index('idx_workout_sessions_user_status').on(table.clerkUserId, table.status),
    userDayDate: uniqueIndex('uq_workout_sessions_user_day_date').on(
      table.clerkUserId,
      table.templateDayId,
      table.localDate,
    ),
  }),
);

export const workoutExerciseEntries = pgTable(
  'workout_exercise_entries',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    assignmentId: text('assignment_id')
      .notNull()
      .references(() => templateExerciseAssignments.id),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id),
    selectedExerciseId: text('selected_exercise_id')
      .notNull()
      .references(() => exercises.id),
    position: integer('position').notNull(),
    notes: text('notes').notNull().default(''),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionPosition: index('idx_workout_exercise_entries_session').on(table.sessionId, table.position),
    selectedExercise: index('idx_workout_exercise_entries_selected_exercise').on(table.selectedExerciseId),
    sessionAssignment: uniqueIndex('uq_workout_exercise_entries_session_assignment').on(
      table.sessionId,
      table.assignmentId,
    ),
  }),
);

export const setEntries = pgTable(
  'set_entries',
  {
    id: text('id').primaryKey(),
    workoutExerciseEntryId: text('workout_exercise_entry_id')
      .notNull()
      .references(() => workoutExerciseEntries.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    targetReps: integer('target_reps'),
    targetLabel: text('target_label').notNull(),
    weight: doublePrecision('weight'),
    reps: integer('reps'),
    unit: text('unit').notNull().default('lb'),
    rpe: doublePrecision('rpe'),
    completed: boolean('completed').notNull().default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entryPosition: uniqueIndex('uq_set_entries_entry_position').on(table.workoutExerciseEntryId, table.position),
    completedIndex: index('idx_set_entries_completed').on(table.completed, table.completedAt),
  }),
);
