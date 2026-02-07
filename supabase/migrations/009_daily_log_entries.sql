-- Daily Log Entries table
-- Tracks daily health metrics: sleep, weight, body fat percentage
-- One entry per day per user (upsert pattern)

CREATE TABLE daily_log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  sleep_hours NUMERIC(4,2) CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  weight_kg NUMERIC(5,2) CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 500)),
  body_fat_percent NUMERIC(4,1) CHECK (body_fat_percent IS NULL OR (body_fat_percent >= 1 AND body_fat_percent <= 60)),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, logged_date),
  -- At least one of sleep_hours or weight_kg must be provided
  CONSTRAINT daily_log_has_data CHECK (sleep_hours IS NOT NULL OR weight_kg IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_daily_log_entries_user_id ON daily_log_entries(user_id);
CREATE INDEX idx_daily_log_entries_logged_date ON daily_log_entries(logged_date DESC);
CREATE INDEX idx_daily_log_entries_user_date ON daily_log_entries(user_id, logged_date DESC);

-- RLS
ALTER TABLE daily_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily log entries"
  ON daily_log_entries FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own daily log entries"
  ON daily_log_entries FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own daily log entries"
  ON daily_log_entries FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own daily log entries"
  ON daily_log_entries FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Updated_at trigger (uses existing function from 001_initial_schema.sql)
CREATE TRIGGER update_daily_log_entries_updated_at
  BEFORE UPDATE ON daily_log_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
