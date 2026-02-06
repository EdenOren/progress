/**
 * Settings types for the Progress app.
 * These interfaces represent user preferences and module configuration.
 */

import type { UUID, ISODateTime } from './domain';

// ============================================================================
// Module Types
// ============================================================================

/** Available tracking modules */
export type ModuleKey = 'workout' | 'sleep' | 'nutrition';

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

/** Union type for all module settings */
export interface ModuleSettingsMap {
  workout?: WorkoutModuleSettings;
  // Future modules:
  // sleep?: SleepModuleSettings;
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
    key: 'sleep',
    name: 'Sleep',
    icon: 'sleep',
    description: 'Track sleep patterns and quality',
    isAvailable: false,
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

/** Default user settings for new users */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  enabled_modules: ['workout'],
  active_module: 'workout',
  module_settings: {},
};
