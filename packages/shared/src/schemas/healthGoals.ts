import { z } from 'zod';
import { uuidSchema, isoDateTimeSchema } from './domain';

// ============================================================================
// Health Goals Schemas
// ============================================================================

/** Health goals record schema */
export const healthGoalsSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  sleep_target_hours: z.number().min(0).max(24).nullable(),
  water_target_liters: z.number().min(0).max(20).nullable(),
  weight_target_kg: z.number().min(20).max(500).nullable(),
  waist_target_cm: z.number().min(30).max(300).nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

/** Health goals upsert schema */
export const healthGoalsUpsertSchema = z.object({
  sleep_target_hours: z.number().min(0).max(24).nullable().optional(),
  water_target_liters: z.number().min(0).max(20).nullable().optional(),
  weight_target_kg: z.number().min(20).max(500).nullable().optional(),
  waist_target_cm: z.number().min(30).max(300).nullable().optional(),
});
