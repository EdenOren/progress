-- ============================================================================
-- Expand Daily Log Entries
-- ============================================================================
-- Adds water intake and waist circumference columns.
-- Deprecates body_fat_percent (column retained for historical data).
-- ============================================================================

-- Add new columns (separate ADD COLUMN and CHECK for clarity)
ALTER TABLE daily_log_entries
ADD COLUMN water_intake_liters NUMERIC(4,2);

ALTER TABLE daily_log_entries
ADD CONSTRAINT check_water_intake_range
CHECK (water_intake_liters IS NULL OR (water_intake_liters >= 0 AND water_intake_liters <= 20));

ALTER TABLE daily_log_entries
ADD COLUMN waist_cm NUMERIC(5,1);

ALTER TABLE daily_log_entries
ADD CONSTRAINT check_waist_cm_range
CHECK (waist_cm IS NULL OR (waist_cm >= 30 AND waist_cm <= 300));

-- Update the data constraint: now any of sleep, weight, water, or waist satisfies it
ALTER TABLE daily_log_entries DROP CONSTRAINT IF EXISTS daily_log_has_data;

ALTER TABLE daily_log_entries
ADD CONSTRAINT daily_log_has_data
CHECK (
  sleep_hours IS NOT NULL
  OR weight_kg IS NOT NULL
  OR water_intake_liters IS NOT NULL
  OR waist_cm IS NOT NULL
);

-- Mark body_fat_percent as deprecated
COMMENT ON COLUMN daily_log_entries.body_fat_percent IS 'DEPRECATED: No longer shown in UI. Column retained for historical data.';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN daily_log_entries.water_intake_liters IS 'Water intake in liters (0-20)';
COMMENT ON COLUMN daily_log_entries.waist_cm IS 'Waist circumference in centimeters (30-300)';
