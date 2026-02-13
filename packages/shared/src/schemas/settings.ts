import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema } from './domain';

// ============================================================================
// Unit Schemas
// ============================================================================

/** Distance unit validation */
export const distanceUnitSchema = z.enum(['km', 'miles']);

/** Weight unit validation */
export const weightUnitSchema = z.enum(['kg', 'lbs']);

// ============================================================================
// Module Settings Schemas
// ============================================================================

/** Workout module settings schema */
export const workoutModuleSettingsSchema = z.object({
  distance_unit: distanceUnitSchema,
  weight_unit: weightUnitSchema,
});

/** Daily log module settings schema */
export const dailyLogModuleSettingsSchema = z.object({
  weight_unit: weightUnitSchema,
});

/** Module settings map schema (JSONB content) */
export const moduleSettingsMapSchema = z.object({
  workout: workoutModuleSettingsSchema.optional(),
  daily_log: dailyLogModuleSettingsSchema.optional(),
});

// ============================================================================
// User Settings Schemas
// ============================================================================

/** User settings schema */
export const userSettingsSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  /** @deprecated Module system removed. Kept for DB parse compatibility. */
  enabled_modules: z.array(z.string()),
  /** @deprecated Module system removed. Kept for DB parse compatibility. */
  active_module: z.string(),
  module_settings: moduleSettingsMapSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

/** User settings update schema */
export const userSettingsUpdateSchema = z.object({
  module_settings: moduleSettingsMapSchema.optional(),
});
