-- ============================================================================
-- Progress App - Seed Data
-- ============================================================================
-- Run this after the initial migration to populate required data.
-- ============================================================================

-- ============================================================================
-- DOMAINS
-- ============================================================================
-- Initial domains for the MVP. Add more as the app expands.

INSERT INTO domains (id, key, name, icon) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'workout', 'Workout', 'dumbbell')
ON CONFLICT (key) DO NOTHING;

-- Future domains (commented out for now)
-- INSERT INTO domains (id, key, name, icon) VALUES
--   ('d0000000-0000-0000-0000-000000000002', 'nutrition', 'Nutrition', 'utensils'),
--   ('d0000000-0000-0000-0000-000000000003', 'sleep', 'Sleep', 'moon'),
--   ('d0000000-0000-0000-0000-000000000004', 'study', 'Study', 'book'),
--   ('d0000000-0000-0000-0000-000000000005', 'meditation', 'Meditation', 'brain')
-- ON CONFLICT (key) DO NOTHING;
