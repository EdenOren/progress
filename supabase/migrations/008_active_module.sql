-- ============================================================================
-- Active Module Migration
-- ============================================================================
-- Adds active_module column to user_settings for cross-device sync of
-- the currently selected module.
-- ============================================================================

-- Add active_module column with default value 'workout'
ALTER TABLE user_settings
ADD COLUMN active_module TEXT NOT NULL DEFAULT 'workout';

-- Add check constraint to ensure valid module values
ALTER TABLE user_settings
ADD CONSTRAINT valid_active_module
CHECK (active_module IN ('workout', 'sleep', 'nutrition'));

-- ============================================================================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- ============================================================================
-- Update to include active_module when creating new user settings

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );

  -- Create default user settings with active_module
  INSERT INTO user_settings (user_id, enabled_modules, module_settings, active_module)
  VALUES (
    NEW.id,
    ARRAY['workout'],
    '{}'::jsonb,
    'workout'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_settings.active_module IS 'Currently selected module for the user (synced across devices)';
