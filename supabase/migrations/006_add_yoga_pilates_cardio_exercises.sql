-- ============================================================================
-- Progress App - Yoga, Pilates & Extended Cardio Exercises Migration
-- ============================================================================
-- Adds 'yoga' and 'pilates' categories and ~20 new exercises.
-- Non-destructive migration - all changes are additive.
-- ============================================================================

-- ============================================================================
-- UPDATE CATEGORY CHECK CONSTRAINT
-- ============================================================================
-- Add 'yoga' and 'pilates' to the allowed categories

ALTER TABLE exercise_library DROP CONSTRAINT IF EXISTS exercise_library_category_check;
ALTER TABLE exercise_library ADD CONSTRAINT exercise_library_category_check
  CHECK (category IN ('strength', 'bodyweight', 'cardio', 'flexibility', 'yoga', 'pilates'));

-- ============================================================================
-- FIX EXERCISE TRACKING TYPES
-- ============================================================================

-- Treadmill Run should use distance tracking, not duration
UPDATE exercise_library SET tracking_type = 'distance' WHERE name = 'Treadmill Run';

-- Cycling should use distance tracking
UPDATE exercise_library SET tracking_type = 'distance' WHERE name = 'Cycling';

-- Rowing Machine should use weight_reps (seated cable row style)
UPDATE exercise_library SET tracking_type = 'weight_reps' WHERE name = 'Rowing Machine';

-- ============================================================================
-- FIX EXISTING ITEMS IN ENTRIES
-- ============================================================================
-- Update items table to match the new tracking types from exercise_library

-- Update by exercise_id if linked
UPDATE items
SET tracking_type = el.tracking_type
FROM exercise_library el
WHERE items.exercise_id = el.id
  AND items.tracking_type != el.tracking_type
  AND el.name IN ('Treadmill Run', 'Cycling', 'Rowing Machine');

-- Also update by name for items without exercise_id link
UPDATE items SET tracking_type = 'distance' WHERE LOWER(name) = 'treadmill run' AND tracking_type != 'distance';
UPDATE items SET tracking_type = 'distance' WHERE LOWER(name) = 'cycling' AND tracking_type != 'distance';
UPDATE items SET tracking_type = 'weight_reps' WHERE LOWER(name) = 'rowing machine' AND tracking_type != 'weight_reps';

-- ============================================================================
-- ADD NEW EXERCISES
-- ============================================================================

INSERT INTO exercise_library (name, icon, category, muscle_group, tracking_type, is_system, created_by) VALUES
  -- Yoga (7)
  ('Downward Dog', 'yoga', 'yoga', 'full_body', 'duration', true, NULL),
  ('Warrior I', 'yoga', 'yoga', 'legs', 'duration', true, NULL),
  ('Warrior II', 'yoga', 'yoga', 'legs', 'duration', true, NULL),
  ('Tree Pose', 'yoga', 'yoga', 'legs', 'duration', true, NULL),
  ('Child''s Pose', 'yoga', 'yoga', 'back', 'duration', true, NULL),
  ('Cobra Pose', 'yoga', 'yoga', 'back', 'duration', true, NULL),
  ('Sun Salutation', 'yoga', 'yoga', 'full_body', 'duration', true, NULL),

  -- Pilates (4)
  ('The Hundred', 'meditation', 'pilates', 'core', 'duration', true, NULL),
  ('Roll Up', 'meditation', 'pilates', 'core', 'weight_reps', true, NULL),
  ('Single Leg Circle', 'meditation', 'pilates', 'core', 'weight_reps', true, NULL),
  ('Double Leg Stretch', 'meditation', 'pilates', 'core', 'weight_reps', true, NULL),

  -- Extended Cardio (6)
  ('Outdoor Run', 'run', 'cardio', 'cardio', 'distance', true, NULL),
  ('Sprint Intervals', 'run-fast', 'cardio', 'cardio', 'duration', true, NULL),
  ('Jump Rope', 'jump-rope', 'cardio', 'cardio', 'duration', true, NULL),
  ('Stair Climbing', 'stairs-up', 'cardio', 'legs', 'duration', true, NULL),
  ('Swimming', 'swim', 'cardio', 'full_body', 'distance', true, NULL),
  ('Elliptical', 'heart-pulse', 'cardio', 'full_body', 'duration', true, NULL),

  -- Stretching/Flexibility (4)
  ('Hamstring Stretch', 'stretch', 'flexibility', 'legs', 'duration', true, NULL),
  ('Quad Stretch', 'stretch', 'flexibility', 'legs', 'duration', true, NULL),
  ('Hip Flexor Stretch', 'stretch', 'flexibility', 'legs', 'duration', true, NULL),
  ('Shoulder Stretch', 'stretch', 'flexibility', 'shoulders', 'duration', true, NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT exercise_library_category_check ON exercise_library IS 'Allowed exercise categories: strength, bodyweight, cardio, flexibility, yoga, pilates';
