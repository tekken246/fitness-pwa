INSERT INTO workout_templates (id, name, version, source, is_seed)
VALUES ('seed_push_pull_legs_arms_v1', 'PDF Seed Push Pull Legs Arms', 1, 'uploaded_workout_schedule_pdf', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO workout_template_days (id, template_id, day_of_week, display_order, slug, name, muscle_group, is_rest_day, is_optional)
VALUES
  ('seed_day_monday_chest_triceps', 'seed_push_pull_legs_arms_v1', 1, 1, 'monday-chest-triceps', 'Monday', 'Chest + Triceps', false, false),
  ('seed_day_tuesday_back_biceps', 'seed_push_pull_legs_arms_v1', 2, 2, 'tuesday-back-biceps', 'Tuesday', 'Back + Biceps', false, false),
  ('seed_day_wednesday_shoulders_abs', 'seed_push_pull_legs_arms_v1', 3, 3, 'wednesday-shoulders-abs', 'Wednesday', 'Shoulders + Abs', false, false),
  ('seed_day_thursday_quads_hamstrings', 'seed_push_pull_legs_arms_v1', 4, 4, 'thursday-quads-hamstrings', 'Thursday', 'Quads + Hamstrings', false, false),
  ('seed_day_friday_arms', 'seed_push_pull_legs_arms_v1', 5, 5, 'friday-biceps-triceps', 'Friday', 'Biceps + Triceps', false, false),
  ('seed_day_saturday_optional', 'seed_push_pull_legs_arms_v1', 6, 6, 'saturday-rest-cardio-core', 'Saturday', 'Rest / Cardio + Core optional', true, true),
  ('seed_day_sunday_rest', 'seed_push_pull_legs_arms_v1', 7, 7, 'sunday-rest', 'Sunday', 'Rest', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercises (id, name, category, measurement_type, default_unit)
VALUES
  ('flat-bench-press', 'Flat Bench Press', 'chest', 'weighted', 'lb'),
  ('incline-dumbbell-press', 'Incline Dumbbell Press', 'chest', 'weighted', 'lb'),
  ('cable-fly', 'Cable Fly', 'chest', 'weighted', 'lb'),
  ('pec-deck', 'Pec Deck', 'chest', 'weighted', 'lb'),
  ('tricep-pushdown', 'Tricep Pushdown', 'triceps', 'weighted', 'lb'),
  ('overhead-db-extension', 'Overhead DB Extension', 'triceps', 'weighted', 'lb'),
  ('dips', 'Dips', 'triceps', 'assisted_bodyweight', 'lb'),
  ('pull-ups', 'Pull-Ups', 'back', 'assisted_bodyweight', 'lb'),
  ('lat-pulldown', 'Lat Pulldown', 'back', 'weighted', 'lb'),
  ('barbell-row', 'Barbell Row', 'back', 'weighted', 'lb'),
  ('seated-cable-row', 'Seated Cable Row', 'back', 'weighted', 'lb'),
  ('dumbbell-pullover', 'Dumbbell Pullover', 'back', 'weighted', 'lb'),
  ('barbell-curl', 'Barbell Curl', 'biceps', 'weighted', 'lb'),
  ('incline-dumbbell-curl', 'Incline Dumbbell Curl', 'biceps', 'weighted', 'lb'),
  ('seated-shoulder-press', 'Seated Shoulder Press', 'shoulders', 'weighted', 'lb'),
  ('db-lateral-raise', 'DB Lateral Raise', 'shoulders', 'weighted', 'lb'),
  ('reverse-pec-deck', 'Reverse Pec Deck', 'shoulders', 'weighted', 'lb'),
  ('upright-row', 'Upright Row', 'shoulders', 'weighted', 'lb'),
  ('hanging-leg-raise', 'Hanging Leg Raise', 'abs', 'reps_only', 'none'),
  ('cable-crunch', 'Cable Crunch', 'abs', 'weighted', 'lb'),
  ('barbell-squat', 'Barbell Squat', 'legs', 'weighted', 'lb'),
  ('leg-press', 'Leg Press', 'legs', 'weighted', 'lb'),
  ('walking-lunges', 'Walking Lunges', 'legs', 'weighted', 'lb'),
  ('leg-extension', 'Leg Extension', 'legs', 'weighted', 'lb'),
  ('lying-leg-curl', 'Lying Leg Curl', 'legs', 'weighted', 'lb'),
  ('romanian-deadlift', 'Romanian Deadlift', 'legs', 'weighted', 'lb'),
  ('standing-calf-raise', 'Standing Calf Raise', 'calves', 'weighted', 'lb'),
  ('close-grip-bench-press', 'Close-Grip Bench Press', 'triceps', 'weighted', 'lb'),
  ('skull-crushers', 'Skull Crushers', 'triceps', 'weighted', 'lb'),
  ('hammer-curl', 'Hammer Curl', 'biceps', 'weighted', 'lb'),
  ('preacher-curl', 'Preacher Curl', 'biceps', 'weighted', 'lb'),
  ('cardio-core-optional', 'Cardio + Core Optional', 'conditioning', 'cardio_optional', 'none')
ON CONFLICT (id) DO NOTHING;

INSERT INTO template_exercise_assignments (id, day_id, exercise_id, alternative_exercise_id, display_name, position, target_reps, sets, target_type, target_note, per_side, is_optional)
VALUES
  ('seed_mon_01_flat_bench', 'seed_day_monday_chest_triceps', 'flat-bench-press', null, 'Flat Bench Press', 1, ARRAY[8,10,8,6], 4, 'reps', null, false, false),
  ('seed_mon_02_incline_db', 'seed_day_monday_chest_triceps', 'incline-dumbbell-press', null, 'Incline Dumbbell Press', 2, ARRAY[10,10,8,8], 4, 'reps', null, false, false),
  ('seed_mon_03_cable_fly', 'seed_day_monday_chest_triceps', 'cable-fly', 'pec-deck', 'Cable Fly or Pec Deck', 3, ARRAY[15,12,12,10], 4, 'reps', null, false, false),
  ('seed_mon_04_pushdown', 'seed_day_monday_chest_triceps', 'tricep-pushdown', null, 'Tricep Pushdown', 4, ARRAY[12,10,10,8], 4, 'reps', null, false, false),
  ('seed_mon_05_overhead_ext', 'seed_day_monday_chest_triceps', 'overhead-db-extension', null, 'Overhead DB Extension', 5, ARRAY[12,10,8], 3, 'reps', null, false, false),
  ('seed_mon_06_dips', 'seed_day_monday_chest_triceps', 'dips', null, 'Dips', 6, ARRAY[]::integer[], 3, 'failure', '3 sets to failure or assisted', false, false),

  ('seed_tue_01_pullups', 'seed_day_tuesday_back_biceps', 'pull-ups', 'lat-pulldown', 'Pull-Ups or Lat Pulldown', 1, ARRAY[12,10,10,8], 4, 'reps', null, false, false),
  ('seed_tue_02_barbell_row', 'seed_day_tuesday_back_biceps', 'barbell-row', null, 'Barbell Row', 2, ARRAY[10,8,8,6], 4, 'reps', null, false, false),
  ('seed_tue_03_cable_row', 'seed_day_tuesday_back_biceps', 'seated-cable-row', null, 'Seated Cable Row', 3, ARRAY[12,10,8,8], 4, 'reps', null, false, false),
  ('seed_tue_04_pullover', 'seed_day_tuesday_back_biceps', 'dumbbell-pullover', null, 'Dumbbell Pullover', 4, ARRAY[12,10,8], 3, 'reps', null, false, false),
  ('seed_tue_05_barbell_curl', 'seed_day_tuesday_back_biceps', 'barbell-curl', null, 'Barbell Curl', 5, ARRAY[10,8,8,6], 4, 'reps', null, false, false),
  ('seed_tue_06_incline_curl', 'seed_day_tuesday_back_biceps', 'incline-dumbbell-curl', null, 'Incline Dumbbell Curl', 6, ARRAY[12,10,8], 3, 'reps', null, false, false),

  ('seed_wed_01_shoulder_press', 'seed_day_wednesday_shoulders_abs', 'seated-shoulder-press', null, 'Seated Shoulder Press', 1, ARRAY[10,8,8,6], 4, 'reps', null, false, false),
  ('seed_wed_02_lateral_raise', 'seed_day_wednesday_shoulders_abs', 'db-lateral-raise', null, 'DB Lateral Raise', 2, ARRAY[15,12,12,10], 4, 'reps', null, false, false),
  ('seed_wed_03_reverse_pec', 'seed_day_wednesday_shoulders_abs', 'reverse-pec-deck', null, 'Reverse Pec Deck', 3, ARRAY[15,12,12,10], 4, 'reps', null, false, false),
  ('seed_wed_04_upright_row', 'seed_day_wednesday_shoulders_abs', 'upright-row', null, 'Upright Row', 4, ARRAY[10,10,8], 3, 'reps', null, false, false),
  ('seed_wed_05_leg_raise', 'seed_day_wednesday_shoulders_abs', 'hanging-leg-raise', null, 'Hanging Leg Raise', 5, ARRAY[15,15,12], 3, 'reps', null, false, false),
  ('seed_wed_06_cable_crunch', 'seed_day_wednesday_shoulders_abs', 'cable-crunch', null, 'Cable Crunch', 6, ARRAY[20,15,15], 3, 'reps', null, false, false),

  ('seed_thu_01_squat_press', 'seed_day_thursday_quads_hamstrings', 'barbell-squat', 'leg-press', 'Barbell Squat or Leg Press', 1, ARRAY[10,8,8,6], 4, 'reps', null, false, false),
  ('seed_thu_02_lunges', 'seed_day_thursday_quads_hamstrings', 'walking-lunges', null, 'Walking Lunges', 2, ARRAY[12,12,12], 3, 'reps', '12 each leg x3', true, false),
  ('seed_thu_03_leg_extension', 'seed_day_thursday_quads_hamstrings', 'leg-extension', null, 'Leg Extension', 3, ARRAY[15,12,10,10], 4, 'reps', null, false, false),
  ('seed_thu_04_leg_curl', 'seed_day_thursday_quads_hamstrings', 'lying-leg-curl', null, 'Lying Leg Curl', 4, ARRAY[12,10,10,8], 4, 'reps', null, false, false),
  ('seed_thu_05_rdl', 'seed_day_thursday_quads_hamstrings', 'romanian-deadlift', null, 'Romanian Deadlift', 5, ARRAY[10,8,8], 3, 'reps', null, false, false),
  ('seed_thu_06_calf_raise', 'seed_day_thursday_quads_hamstrings', 'standing-calf-raise', null, 'Standing Calf Raise', 6, ARRAY[20,15,15], 3, 'reps', null, false, false),

  ('seed_fri_01_close_grip', 'seed_day_friday_arms', 'close-grip-bench-press', null, 'Close-Grip Bench Press', 1, ARRAY[10,8,8,6], 4, 'reps', null, false, false),
  ('seed_fri_02_pushdown', 'seed_day_friday_arms', 'tricep-pushdown', null, 'Tricep Pushdown', 2, ARRAY[12,10,10,8], 4, 'reps', null, false, false),
  ('seed_fri_03_skull', 'seed_day_friday_arms', 'skull-crushers', null, 'Skull Crushers', 3, ARRAY[10,8,8], 3, 'reps', null, false, false),
  ('seed_fri_04_barbell_curl', 'seed_day_friday_arms', 'barbell-curl', null, 'Barbell Curl', 4, ARRAY[10,8,8,6], 4, 'reps', null, false, false),
  ('seed_fri_05_hammer', 'seed_day_friday_arms', 'hammer-curl', null, 'Hammer Curl', 5, ARRAY[12,10,10], 3, 'reps', null, false, false),
  ('seed_fri_06_preacher', 'seed_day_friday_arms', 'preacher-curl', null, 'Preacher Curl', 6, ARRAY[12,10,8], 3, 'reps', null, false, false),
  ('seed_sat_01_optional', 'seed_day_saturday_optional', 'cardio-core-optional', null, 'Cardio + Core Optional', 1, ARRAY[]::integer[], 1, 'optional', 'Optional cardio and core work', false, true)
ON CONFLICT (id) DO NOTHING;
