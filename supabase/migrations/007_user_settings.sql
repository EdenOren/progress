-- ============================================================================
-- User Settings Migration
-- ============================================================================
-- Adds user_settings table for storing module preferences and settings.
-- Uses JSONB for flexible module-specific settings (distance_unit, weight_unit, etc.)
-- ============================================================================

-- ============================================================================
-- USER_SETTINGS TABLE
-- ============================================================================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_modules TEXT[] NOT NULL DEFAULT ARRAY['workout'],
  module_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- ============================================================================
-- Add user_settings creation when a new user signs up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );

  -- Create default user settings
  INSERT INTO user_settings (user_id, enabled_modules, module_settings)
  VALUES (
    NEW.id,
    ARRAY['workout'],
    '{}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_settings IS 'User preferences and module settings (enabled modules, unit preferences, etc.)';
COMMENT ON COLUMN user_settings.enabled_modules IS 'Array of enabled module keys (workout, sleep, nutrition)';
COMMENT ON COLUMN user_settings.module_settings IS 'JSONB object with module-specific settings keyed by module name';
