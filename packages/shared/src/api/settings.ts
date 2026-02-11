import { getSupabase } from '../supabase/client';
import type {
  UserSettings,
  UserSettingsUpdate,
  ModuleKey,
  ModuleSettingsMap,
  WorkoutModuleSettings,
  DailyLogModuleSettings,
} from '../types/settings';
import { userSettingsSchema } from '../schemas/settings';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';
import { DEFAULT_USER_SETTINGS, DEFAULT_WORKOUT_SETTINGS, DEFAULT_DAILY_LOG_SETTINGS } from '../types/settings';

/**
 * Get user settings, auto-creating with defaults if not exists
 */
export async function getUserSettings(userId: string): Promise<Result<UserSettings>> {
  const supabase = getSupabase();

  // Try to get existing settings
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // If not found, create with defaults
  if (error && error.code === 'PGRST116') {
    return createUserSettings(userId);
  }

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = userSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create user settings with defaults (internal function)
 */
async function createUserSettings(userId: string): Promise<Result<UserSettings>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      enabled_modules: DEFAULT_USER_SETTINGS.enabled_modules as string[],
      active_module: DEFAULT_USER_SETTINGS.active_module,
      module_settings: DEFAULT_USER_SETTINGS.module_settings as Record<string, unknown>,
    })
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = userSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  updates: UserSettingsUpdate
): Promise<Result<UserSettings>> {
  const supabase = getSupabase();

  // Build update object with proper types
  const updatePayload: {
    enabled_modules?: string[];
    active_module?: string;
    module_settings?: Record<string, unknown>;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (updates.enabled_modules !== undefined) {
    updatePayload.enabled_modules = updates.enabled_modules as string[];
  }

  if (updates.active_module !== undefined) {
    updatePayload.active_module = updates.active_module;
  }

  if (updates.module_settings !== undefined) {
    updatePayload.module_settings = updates.module_settings as Record<string, unknown>;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .update(updatePayload)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = userSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Toggle a module on or off
 */
export async function toggleModule(
  userId: string,
  moduleKey: ModuleKey,
  enabled: boolean
): Promise<Result<UserSettings>> {
  // Get current settings
  const currentResult = await getUserSettings(userId);
  if (!currentResult.success) {
    return currentResult;
  }

  const currentModules = currentResult.data.enabled_modules;

  let newModules: ModuleKey[];
  if (enabled) {
    // Add module if not already enabled
    newModules = currentModules.includes(moduleKey)
      ? currentModules
      : [...currentModules, moduleKey];
  } else {
    // Remove module
    newModules = currentModules.filter((m) => m !== moduleKey);
  }

  return updateUserSettings(userId, { enabled_modules: newModules });
}

/**
 * Update settings for a specific module
 */
export async function updateModuleSettings(
  userId: string,
  moduleKey: ModuleKey,
  settings: Partial<WorkoutModuleSettings> | Partial<DailyLogModuleSettings>
): Promise<Result<UserSettings>> {
  // Get current settings
  const currentResult = await getUserSettings(userId);
  if (!currentResult.success) {
    return currentResult;
  }

  const currentModuleSettings = currentResult.data.module_settings;

  // Build updated module settings
  const updatedModuleSettings: ModuleSettingsMap = {
    ...currentModuleSettings,
  };

  if (moduleKey === 'workout') {
    const existingWorkout = currentModuleSettings.workout ?? DEFAULT_WORKOUT_SETTINGS;
    updatedModuleSettings.workout = {
      ...existingWorkout,
      ...settings,
    } as WorkoutModuleSettings;
  } else if (moduleKey === 'daily_log') {
    const existingDailyLog = currentModuleSettings.daily_log ?? DEFAULT_DAILY_LOG_SETTINGS;
    updatedModuleSettings.daily_log = {
      ...existingDailyLog,
      ...settings,
    } as DailyLogModuleSettings;
  }

  return updateUserSettings(userId, { module_settings: updatedModuleSettings });
}

/**
 * Get settings for a specific module, with defaults applied
 */
export async function getModuleSettings(
  userId: string,
  moduleKey: ModuleKey
): Promise<Result<WorkoutModuleSettings | DailyLogModuleSettings | undefined>> {
  const settingsResult = await getUserSettings(userId);
  if (!settingsResult.success) {
    return settingsResult;
  }

  if (moduleKey === 'workout') {
    const moduleSettings = settingsResult.data.module_settings.workout;
    return ok(moduleSettings ?? DEFAULT_WORKOUT_SETTINGS);
  }

  if (moduleKey === 'daily_log') {
    const moduleSettings = settingsResult.data.module_settings.daily_log;
    return ok(moduleSettings ?? DEFAULT_DAILY_LOG_SETTINGS);
  }

  return ok(undefined);
}

/**
 * Check if a module is enabled
 */
export async function isModuleEnabled(
  userId: string,
  moduleKey: ModuleKey
): Promise<Result<boolean>> {
  const settingsResult = await getUserSettings(userId);
  if (!settingsResult.success) {
    return settingsResult;
  }

  return ok(settingsResult.data.enabled_modules.includes(moduleKey));
}

/**
 * Update the active module (for cross-device sync)
 */
export async function updateActiveModule(
  userId: string,
  moduleKey: ModuleKey
): Promise<Result<UserSettings>> {
  return updateUserSettings(userId, { active_module: moduleKey });
}
