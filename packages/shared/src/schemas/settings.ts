import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema } from './domain';

// ============================================================================
// Module Schemas
// ============================================================================

/** Module key validation */
export const moduleKeySchema = z.enum(['workout', 'sleep', 'nutrition']);

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

/** Module settings map schema (JSONB content) */
export const moduleSettingsMapSchema = z.object({
  workout: workoutModuleSettingsSchema.optional(),
  // Future modules:
  // sleep: sleepModuleSettingsSchema.optional(),
  // nutrition: nutritionModuleSettingsSchema.optional(),
});

// ============================================================================
// User Settings Schemas
// ============================================================================

/** User settings schema */
export const userSettingsSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  enabled_modules: z.array(moduleKeySchema),
  active_module: moduleKeySchema,
  module_settings: moduleSettingsMapSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

/** User settings update schema */
export const userSettingsUpdateSchema = z.object({
  enabled_modules: z.array(moduleKeySchema).optional(),
  active_module: moduleKeySchema.optional(),
  module_settings: moduleSettingsMapSchema.optional(),
});

/** Schema for toggling a module */
export const toggleModuleInputSchema = z.object({
  moduleKey: moduleKeySchema,
  enabled: z.boolean(),
});

/** Schema for updating module-specific settings */
export const updateModuleSettingsInputSchema = z.object({
  moduleKey: moduleKeySchema,
  settings: workoutModuleSettingsSchema.partial(),
});
