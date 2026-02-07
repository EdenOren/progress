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
  notes: z.string().max(500).nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

/** Daily log entry array schema */
export const dailyLogEntryArraySchema = z.array(dailyLogEntrySchema);

/** Daily log entry insert schema with validation that at least sleep or weight is provided */
export const dailyLogEntryInsertSchema = z.object({
  logged_date: isoDateSchema,
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  weight_kg: z.number().min(20).max(500).nullable().optional(),
  body_fat_percent: z.number().min(1).max(60).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
}).refine(
  (data) => {
    // At least one of sleep_hours or weight_kg must be provided and not null
    const hasSleep = data.sleep_hours !== undefined && data.sleep_hours !== null;
    const hasWeight = data.weight_kg !== undefined && data.weight_kg !== null;
    return hasSleep || hasWeight;
  },
  { message: 'At least sleep hours or weight must be provided' }
);

/** Daily log entry update schema */
export const dailyLogEntryUpdateSchema = z.object({
  sleep_hours: z.number().min(0).max(24).nullable().optional(),
  weight_kg: z.number().min(20).max(500).nullable().optional(),
  body_fat_percent: z.number().min(1).max(60).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});
