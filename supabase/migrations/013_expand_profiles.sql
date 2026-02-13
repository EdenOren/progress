-- ============================================================================
-- Expand Profiles
-- ============================================================================
-- Adds date_of_birth to profiles table.
-- height_cm and weight_kg already exist from 001_initial_schema.sql.
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN date_of_birth DATE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth (used for KPI calculations like waist-to-height ratio)';
