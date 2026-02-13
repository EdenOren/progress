/**
 * Settings types for the Progress app.
 * These interfaces represent user preferences and unit configuration.
 */

import type { UUID, ISODateTime } from './domain';

// ============================================================================
// Unit Types
// ============================================================================

/** Distance unit preference */
export type DistanceUnit = 'km' | 'miles';

/** Weight unit preference */
export type WeightUnit = 'kg' | 'lbs';

// ============================================================================
// Module Settings (unit preferences per feature area)
// ============================================================================

/** Settings specific to the workout feature */
export interface WorkoutModuleSettings {
  distance_unit: DistanceUnit;
  weight_unit: WeightUnit;
}

/** Settings specific to the daily log feature */
export interface DailyLogModuleSettings {
  weight_unit: WeightUnit;
}

/** Map of per-feature settings */
export interface ModuleSettingsMap {
  workout?: WorkoutModuleSettings;
  daily_log?: DailyLogModuleSettings;
}

// ============================================================================
// User Settings
// ============================================================================

/** User settings record */
export interface UserSettings {
  id: UUID;
  user_id: UUID;
  /** @deprecated Module system removed. Field kept for DB compatibility. */
  enabled_modules: string[];
  /** @deprecated Module system removed. Field kept for DB compatibility. */
  active_module: string;
  module_settings: ModuleSettingsMap;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** User settings update input */
export interface UserSettingsUpdate {
  module_settings?: ModuleSettingsMap;
}

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
