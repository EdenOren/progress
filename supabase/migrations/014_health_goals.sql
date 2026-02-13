-- ============================================================================
-- Health Goals Table
-- ============================================================================
-- Single-row-per-user table for health metric targets.
-- Used by KPI dashboard for goal comparisons.
-- Separate from the workout-specific 'goals' table.
-- ============================================================================

CREATE TABLE health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_target_hours NUMERIC(4,1) CHECK (sleep_target_hours IS NULL OR (sleep_target_hours >= 0 AND sleep_target_hours <= 24)),
  water_target_liters NUMERIC(4,2) CHECK (water_target_liters IS NULL OR (water_target_liters >= 0 AND water_target_liters <= 20)),
  weight_target_kg NUMERIC(5,1) CHECK (weight_target_kg IS NULL OR (weight_target_kg >= 20 AND weight_target_kg <= 500)),
  waist_target_cm NUMERIC(5,1) CHECK (waist_target_cm IS NULL OR (waist_target_cm >= 30 AND waist_target_cm <= 300)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_health_goals_user_id ON health_goals(user_id);

-- RLS
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health goals"
  ON health_goals FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own health goals"
  ON health_goals FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own health goals"
  ON health_goals FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own health goals"
  ON health_goals FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Auto-update updated_at (uses existing function from 001_initial_schema.sql)
CREATE TRIGGER set_health_goals_updated_at
  BEFORE UPDATE ON health_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE health_goals IS 'User health metric targets for KPI dashboard comparisons';
COMMENT ON COLUMN health_goals.sleep_target_hours IS 'Target sleep hours per night';
COMMENT ON COLUMN health_goals.water_target_liters IS 'Target water intake in liters per day';
COMMENT ON COLUMN health_goals.weight_target_kg IS 'Target body weight in kilograms (optional)';
COMMENT ON COLUMN health_goals.waist_target_cm IS 'Target waist circumference in centimeters (optional)';
