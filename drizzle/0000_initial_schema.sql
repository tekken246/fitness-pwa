CREATE TABLE IF NOT EXISTS user_settings (
  clerk_user_id text PRIMARY KEY,
  unit text NOT NULL DEFAULT 'lb' CHECK (unit IN ('lb', 'kg')),
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'rose')),
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  version integer NOT NULL,
  source text NOT NULL,
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);

CREATE TABLE IF NOT EXISTS workout_template_days (
  id text PRIMARY KEY,
  template_id text NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  display_order integer NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  muscle_group text NOT NULL,
  is_rest_day boolean NOT NULL DEFAULT false,
  is_optional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, day_of_week),
  UNIQUE (template_id, slug)
);

CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  measurement_type text NOT NULL CHECK (measurement_type IN ('weighted', 'bodyweight', 'assisted_bodyweight', 'reps_only', 'cardio_optional')),
  default_unit text NOT NULL DEFAULT 'lb' CHECK (default_unit IN ('lb', 'kg', 'none')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS template_exercise_assignments (
  id text PRIMARY KEY,
  day_id text NOT NULL REFERENCES workout_template_days(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id),
  alternative_exercise_id text REFERENCES exercises(id),
  display_name text NOT NULL,
  position integer NOT NULL,
  target_reps integer[] NOT NULL DEFAULT '{}',
  sets integer NOT NULL CHECK (sets > 0),
  target_type text NOT NULL CHECK (target_type IN ('reps', 'failure', 'optional')),
  target_note text,
  per_side boolean NOT NULL DEFAULT false,
  is_optional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_id, position)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id text PRIMARY KEY,
  clerk_user_id text NOT NULL,
  template_day_id text NOT NULL REFERENCES workout_template_days(id),
  local_date date NOT NULL,
  timezone text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clerk_user_id, template_day_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions (clerk_user_id, local_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_status ON workout_sessions (clerk_user_id, status);

CREATE TABLE IF NOT EXISTS workout_exercise_entries (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  assignment_id text NOT NULL REFERENCES template_exercise_assignments(id),
  exercise_id text NOT NULL REFERENCES exercises(id),
  selected_exercise_id text NOT NULL REFERENCES exercises(id),
  position integer NOT NULL,
  notes text NOT NULL DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_workout_exercise_entries_session ON workout_exercise_entries (session_id, position);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_entries_selected_exercise ON workout_exercise_entries (selected_exercise_id);

CREATE TABLE IF NOT EXISTS set_entries (
  id text PRIMARY KEY,
  workout_exercise_entry_id text NOT NULL REFERENCES workout_exercise_entries(id) ON DELETE CASCADE,
  position integer NOT NULL,
  target_reps integer,
  target_label text NOT NULL,
  weight double precision,
  reps integer,
  unit text NOT NULL DEFAULT 'lb' CHECK (unit IN ('lb', 'kg', 'none')),
  rpe double precision,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workout_exercise_entry_id, position)
);

CREATE INDEX IF NOT EXISTS idx_set_entries_entry_position ON set_entries (workout_exercise_entry_id, position);
CREATE INDEX IF NOT EXISTS idx_set_entries_completed ON set_entries (completed, completed_at DESC);
