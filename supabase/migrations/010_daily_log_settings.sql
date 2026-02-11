-- ============================================================================
-- Daily Log Settings Migration
-- ============================================================================
-- Aligns database defaults with TypeScript DEFAULT_USER_SETTINGS:
-- 1. Updates enabled_modules default to include 'daily_log'
-- 2. Updates valid_active_module constraint to include 'daily_log'
-- 3. Updates handle_new_user() trigger to include 'daily_log' in defaults
-- ============================================================================

-- ============================================================================
-- UPDATE COLUMN DEFAULT
-- ============================================================================

ALTER TABLE user_settings
ALTER COLUMN enabled_modules SET DEFAULT ARRAY['workout', 'daily_log'];

-- ============================================================================
-- UPDATE CHECK CONSTRAINT
-- ============================================================================
-- Drop old constraint and add new one that includes 'daily_log'

ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS valid_active_module;

ALTER TABLE user_settings
ADD CONSTRAINT valid_active_module
CHECK (active_module IN ('workout', 'daily_log', 'nutrition'));

-- ============================================================================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- ============================================================================
-- New users now get daily_log enabled by default

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );

  -- Create default user settings with daily_log enabled
  INSERT INTO user_settings (user_id, enabled_modules, module_settings, active_module)
  VALUES (
    NEW.id,
    ARRAY['workout', 'daily_log'],
    '{}'::jsonb,
    'workout'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_settings.enabled_modules IS 'Array of enabled module keys (workout, daily_log, nutrition). Default includes workout and daily_log.';
