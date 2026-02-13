import { z } from 'zod';
import { uuidSchema, isoDateSchema, isoDateTimeSchema } from './domain';

// ============================================================================
// Daily Log Entry Schemas
// ============================================================================

/** Daily log entry schema */
export const dailyLogEntrySchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  logged_date: isoDateSchema,
  sleep_hours: z.number().min(0).max(24).nullable(),
  weight_kg: z.number().min(20).max(500).nullable(),
  body_fat_percent: z.number().min(1).max(60).nullable(),
  water_intake_liters: z.number().min(0).max(20).nullable(),
  waist_cm: z.number().min(30).max(300).nullable(),
  notes: z.string().max(500).nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

/** Daily log entry array schema */
export const dailyLogEntryArraySchema = z.array(dailyLogEntrySchema);

/** Daily log entry insert schema with validation that at least one metric is provided */
export const dailyLogEntryInsertSchema = z.object({
  logged_date: isoDateSchema,
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  weight_kg: z.number().min(20).max(500).nullable().optional(),
  body_fat_percent: z.number().min(1).max(60).nullable().optional(),
  water_intake_liters: z.number().min(0).max(20).nullable().optional(),
  waist_cm: z.number().min(30).max(300).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(
  (data) => {
    const hasSleep = data.sleep_hours !== undefined && data.sleep_hours !== null;
    const hasWeight = data.weight_kg !== undefined && data.weight_kg !== null;
    const hasWater = data.water_intake_liters !== undefined && data.water_intake_liters !== null;
    const hasWaist = data.waist_cm !== undefined && data.waist_cm !== null;
    return hasSleep || hasWeight || hasWater || hasWaist;
  },
  { message: 'At least one metric (sleep, weight, water, or waist) must be provided' }
);

/** Daily log entry update schema */
export const dailyLogEntryUpdateSchema = z.object({
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  weight_kg: z.number().min(20).max(500).nullable().optional(),
  body_fat_percent: z.number().min(1).max(60).nullable().optional(),
  water_intake_liters: z.number().min(0).max(20).nullable().optional(),
  waist_cm: z.number().min(30).max(300).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
