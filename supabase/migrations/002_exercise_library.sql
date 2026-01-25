-- ============================================================================
-- Progress App - Exercise Library & Workout Templates Migration
-- ============================================================================
-- Adds exercise library, workout templates, and tracking type support.
-- Non-destructive migration - all changes are additive.
-- ============================================================================

-- ============================================================================
-- EXERCISE_LIBRARY
-- ============================================================================
-- System and user-created exercise catalog with icons and tracking types

CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('strength', 'bodyweight', 'cardio', 'flexibility')),
  muscle_group TEXT NOT NULL CHECK (muscle_group IN ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body')),
  tracking_type TEXT NOT NULL DEFAULT 'weight_reps' CHECK (tracking_type IN ('weight_reps', 'duration', 'distance')),
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique indexes (handles NULL created_by for system exercises)
CREATE UNIQUE INDEX idx_exercise_system_name ON exercise_library(name) WHERE is_system = true;
CREATE UNIQUE INDEX idx_exercise_user_name ON exercise_library(name, created_by) WHERE is_system = false;

-- General indexes
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_muscle_group ON exercise_library(muscle_group);
CREATE INDEX idx_exercise_library_created_by ON exercise_library(created_by) WHERE created_by IS NOT NULL;

-- RLS for exercise_library
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View system or own exercises"
  ON exercise_library FOR SELECT
  USING (is_system = true OR auth.uid() = created_by);

CREATE POLICY "Create own exercises"
  ON exercise_library FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Update own exercises"
  ON exercise_library FOR UPDATE
  USING (auth.uid() = created_by AND is_system = false)
  WITH CHECK (auth.uid() = created_by AND is_system = false);

CREATE POLICY "Delete own exercises"
  ON exercise_library FOR DELETE
  USING (auth.uid() = created_by AND is_system = false);

-- ============================================================================
-- SEED EXERCISE LIBRARY (40 exercises)
-- ============================================================================

INSERT INTO exercise_library (name, icon, category, muscle_group, tracking_type, is_system, created_by) VALUES
  -- Chest (6)
  ('Flat Bench Press', 'dumbbell', 'strength', 'chest', 'weight_reps', true, NULL),
  ('Incline Bench Press', 'dumbbell', 'strength', 'chest', 'weight_reps', true, NULL),
  ('Dumbbell Chest Fly', 'dumbbell', 'strength', 'chest', 'weight_reps', true, NULL),
  ('Cable Crossover', 'dumbbell', 'strength', 'chest', 'weight_reps', true, NULL),
  ('Push-ups', 'human', 'bodyweight', 'chest', 'weight_reps', true, NULL),
  ('Chest Press Machine', 'dumbbell', 'strength', 'chest', 'weight_reps', true, NULL),

  -- Back (7)
  ('Deadlift', 'weight-lifter', 'strength', 'back', 'weight_reps', true, NULL),
  ('Barbell Row', 'weight-lifter', 'strength', 'back', 'weight_reps', true, NULL),
  ('Lat Pulldown', 'dumbbell', 'strength', 'back', 'weight_reps', true, NULL),
  ('Seated Cable Row', 'rowing', 'strength', 'back', 'weight_reps', true, NULL),
  ('Pull-ups', 'human', 'bodyweight', 'back', 'weight_reps', true, NULL),
  ('T-Bar Row', 'weight-lifter', 'strength', 'back', 'weight_reps', true, NULL),
  ('Face Pull', 'dumbbell', 'strength', 'back', 'weight_reps', true, NULL),

  -- Legs (8)
  ('Back Squat', 'weight-lifter', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Front Squat', 'weight-lifter', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Leg Press', 'weight-lifter', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Lunges', 'human', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Leg Extension', 'dumbbell', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Leg Curl', 'dumbbell', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Calf Raises', 'human', 'strength', 'legs', 'weight_reps', true, NULL),
  ('Romanian Deadlift', 'weight-lifter', 'strength', 'legs', 'weight_reps', true, NULL),

  -- Shoulders (5)
  ('Overhead Press', 'human-handsup', 'strength', 'shoulders', 'weight_reps', true, NULL),
  ('Lateral Raise', 'dumbbell', 'strength', 'shoulders', 'weight_reps', true, NULL),
  ('Front Raise', 'dumbbell', 'strength', 'shoulders', 'weight_reps', true, NULL),
  ('Rear Delt Fly', 'dumbbell', 'strength', 'shoulders', 'weight_reps', true, NULL),
  ('Shrugs', 'dumbbell', 'strength', 'shoulders', 'weight_reps', true, NULL),

  -- Arms (6)
  ('Barbell Curl', 'arm-flex', 'strength', 'arms', 'weight_reps', true, NULL),
  ('Hammer Curl', 'arm-flex', 'strength', 'arms', 'weight_reps', true, NULL),
  ('Preacher Curl', 'arm-flex', 'strength', 'arms', 'weight_reps', true, NULL),
  ('Tricep Pushdown', 'arm-flex', 'strength', 'arms', 'weight_reps', true, NULL),
  ('Tricep Dips', 'human', 'bodyweight', 'arms', 'weight_reps', true, NULL),
  ('Skull Crusher', 'dumbbell', 'strength', 'arms', 'weight_reps', true, NULL),

  -- Core (5)
  ('Plank', 'human', 'bodyweight', 'core', 'duration', true, NULL),
  ('Hanging Leg Raise', 'human', 'bodyweight', 'core', 'weight_reps', true, NULL),
  ('Cable Crunch', 'dumbbell', 'strength', 'core', 'weight_reps', true, NULL),
  ('Russian Twist', 'human', 'bodyweight', 'core', 'weight_reps', true, NULL),
  ('Ab Wheel Rollout', 'human', 'bodyweight', 'core', 'weight_reps', true, NULL),

  -- Cardio (3)
  ('Treadmill Run', 'run', 'cardio', 'cardio', 'duration', true, NULL),
  ('Cycling', 'bike', 'cardio', 'cardio', 'duration', true, NULL),
  ('Rowing Machine', 'rowing', 'cardio', 'cardio', 'distance', true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- WORKOUT_TEMPLATES
-- ============================================================================
-- Links exercises to subjects with default set configurations

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0),
  default_sets JSONB NOT NULL DEFAULT '[{"target_reps": 10}]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(subject_id, exercise_id)
);

-- Indexes for workout_templates
CREATE INDEX idx_workout_templates_subject_id ON workout_templates(subject_id);
CREATE INDEX idx_workout_templates_subject_position ON workout_templates(subject_id, position);

-- RLS for workout_templates (access through subject ownership)
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own workout templates"
  ON workout_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = workout_templates.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create own workout templates"
  ON workout_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = workout_templates.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Update own workout templates"
  ON workout_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = workout_templates.subject_id
      AND subjects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = workout_templates.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Delete own workout templates"
  ON workout_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.id = workout_templates.subject_id
      AND subjects.user_id = auth.uid()
    )
  );

-- Updated_at trigger for workout_templates
CREATE TRIGGER update_workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MODIFY ITEMS TABLE
-- ============================================================================
-- Add exercise_id link and tracking type

ALTER TABLE items ADD COLUMN exercise_id UUID REFERENCES exercise_library(id) ON DELETE SET NULL;
ALTER TABLE items ADD COLUMN is_from_template BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE items ADD COLUMN tracking_type TEXT NOT NULL DEFAULT 'weight_reps' CHECK (tracking_type IN ('weight_reps', 'duration', 'distance'));

-- Index for exercise lookup
CREATE INDEX idx_items_exercise_id ON items(exercise_id) WHERE exercise_id IS NOT NULL;

-- ============================================================================
-- MODIFY ITEM_SETS TABLE
-- ============================================================================
-- Add target fields for preset guidance

ALTER TABLE item_sets ADD COLUMN target_reps INTEGER CHECK (target_reps IS NULL OR (target_reps >= 0 AND target_reps <= 1000));
ALTER TABLE item_sets ADD COLUMN target_duration_sec INTEGER CHECK (target_duration_sec IS NULL OR (target_duration_sec >= 0 AND target_duration_sec <= 86400));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exercise_library IS 'System and user-created exercise catalog with icons and tracking types';
COMMENT ON TABLE workout_templates IS 'Links exercises to subjects with default set configurations';
COMMENT ON COLUMN items.exercise_id IS 'Link to exercise_library (null for legacy items)';
COMMENT ON COLUMN items.is_from_template IS 'Whether item was created from template or added ad-hoc';
COMMENT ON COLUMN items.tracking_type IS 'Type of metrics tracked: weight_reps, duration, or distance';
COMMENT ON COLUMN item_sets.target_reps IS 'Target reps from template default_sets';
COMMENT ON COLUMN item_sets.target_duration_sec IS 'Target duration from template default_sets';
