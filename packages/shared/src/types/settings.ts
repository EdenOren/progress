/**
 * Settings types for the Progress app.
 * These interfaces represent user preferences and module configuration.
 */

import type { UUID, ISODateTime } from './domain';

// ============================================================================
// Module Types
// ============================================================================

/** Available tracking modules */
export type ModuleKey = 'workout' | 'daily_log' | 'nutrition';

/** Distance unit preference */
export type DistanceUnit = 'km' | 'miles';

/** Weight unit preference */
export type WeightUnit = 'kg' | 'lbs';

// ============================================================================
// Module Settings
// ============================================================================

/** Settings specific to the workout module */
export interface WorkoutModuleSettings {
  distance_unit: DistanceUnit;
  weight_unit: WeightUnit;
}

/** Settings specific to the daily log module */
export interface DailyLogModuleSettings {
  weight_unit: WeightUnit;
}

/** Union type for all module settings */
export interface ModuleSettingsMap {
  workout?: WorkoutModuleSettings;
  daily_log?: DailyLogModuleSettings;
  // Future modules:
  // nutrition?: NutritionModuleSettings;
}

// ============================================================================
// User Settings
// ============================================================================

/** User settings record */
export interface UserSettings {
  id: UUID;
  user_id: UUID;
  enabled_modules: ModuleKey[];
  active_module: ModuleKey;
  module_settings: ModuleSettingsMap;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** User settings update input */
export interface UserSettingsUpdate {
  enabled_modules?: ModuleKey[];
  active_module?: ModuleKey;
  module_settings?: ModuleSettingsMap;
}

// ============================================================================
// Module Metadata
// ============================================================================

/** Module display information */
export interface ModuleInfo {
  key: ModuleKey;
  name: string;
  icon: string;
  description: string;
  isAvailable: boolean;
}

/** Static module metadata for UI */
export const MODULE_INFO: ModuleInfo[] = [
  {
    key: 'workout',
    name: 'Workout',
    icon: 'dumbbell',
    description: 'Track exercises, sets, and progress',
    isAvailable: true,
  },
  {
    key: 'daily_log',
    name: 'Daily Log',
    icon: 'calendar-check',
    description: 'Track sleep, weight, and body metrics',
    isAvailable: true,
  },
  {
    key: 'nutrition',
    name: 'Nutrition',
    icon: 'food-apple',
    description: 'Track meals and nutrition',
    isAvailable: false,
  },
];

// ============================================================================
// Default Settings
// ============================================================================

/** Default workout module settings */
export const DEFAULT_WORKOUT_SETTINGS: WorkoutModuleSettings = {
  distance_unit: 'km',
  weight_unit: 'kg',
};

/** Default daily log module settings */
export const DEFAULT_DAILY_LOG_SETTINGS: DailyLogModuleSettings = {
  weight_unit: 'kg',
};

/** Default user settings for new users */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  enabled_modules: ['workout', 'daily_log'],
  active_module: 'workout',
  module_settings: {},
};
