-- ============================================================================
-- Simplify User Settings
-- ============================================================================
-- Module system is being removed from the app.
-- Drop the active_module constraint. Columns stay (never delete).
-- Mark module-related columns as deprecated.
-- Update handle_new_user() to stop setting deprecated module values.
-- ============================================================================

-- Remove the active_module check constraint
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS valid_active_module;

-- Mark deprecated columns
COMMENT ON COLUMN user_settings.enabled_modules IS 'DEPRECATED: Module system removed. Column retained for data safety.';
COMMENT ON COLUMN user_settings.active_module IS 'DEPRECATED: Module system removed. Column retained for data safety.';

-- ============================================================================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- ============================================================================
-- Remove module-related values from new user creation.
-- enabled_modules and active_module have column defaults, so they still get
-- populated but we no longer explicitly set them.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );

  -- Create default user settings (module fields use column defaults)
  INSERT INTO user_settings (user_id, module_settings)
  VALUES (
    NEW.id,
    '{}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
