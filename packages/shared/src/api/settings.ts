import { getSupabase } from '../supabase/client';
import type {
  UserSettings,
  UserSettingsUpdate,
  ModuleSettingsMap,
  WorkoutModuleSettings,
  DailyLogModuleSettings,
} from '../types/settings';
import { userSettingsSchema } from '../schemas/settings';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';
import { DEFAULT_WORKOUT_SETTINGS, DEFAULT_DAILY_LOG_SETTINGS } from '../types/settings';

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
      module_settings: {} as Record<string, unknown>,
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

  const updatePayload: {
    module_settings?: Record<string, unknown>;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

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
 * Update settings for a specific feature area (workout or daily_log)
 */
export async function updateModuleSettings(
  userId: string,
  moduleKey: 'workout' | 'daily_log',
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
 * Get settings for a specific feature area, with defaults applied
 */
export async function getModuleSettings(
  userId: string,
  moduleKey: 'workout' | 'daily_log'
): Promise<Result<WorkoutModuleSettings | DailyLogModuleSettings>> {
  const settingsResult = await getUserSettings(userId);
  if (!settingsResult.success) {
    return settingsResult;
  }

  if (moduleKey === 'workout') {
    const moduleSettings = settingsResult.data.module_settings.workout;
    return ok(moduleSettings ?? DEFAULT_WORKOUT_SETTINGS);
  }

  const moduleSettings = settingsResult.data.module_settings.daily_log;
  return ok(moduleSettings ?? DEFAULT_DAILY_LOG_SETTINGS);
}
