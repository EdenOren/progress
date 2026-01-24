import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/** UUID validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** ISO 8601 date-time string */
export const isoDateTimeSchema = z.string().datetime({ message: 'Invalid datetime format' });

/** ISO 8601 date string (YYYY-MM-DD) */
export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format. Expected YYYY-MM-DD'
);

/** Feedback rating */
export const feedbackRatingSchema = z.enum(['success', 'hard', 'fail']);

// ============================================================================
// Profile Schemas
// ============================================================================

export const profileSchema = z.object({
  id: uuidSchema,
  display_name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable(),
  height_cm: z.number().int().min(50).max(300).nullable(),
  weight_kg: z.number().min(20).max(500).nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const profileInsertSchema = z.object({
  id: uuidSchema,
  display_name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable().optional(),
  height_cm: z.number().int().min(50).max(300).nullable().optional(),
  weight_kg: z.number().min(20).max(500).nullable().optional(),
});

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  height_cm: z.number().int().min(50).max(300).nullable().optional(),
  weight_kg: z.number().min(20).max(500).nullable().optional(),
});

// ============================================================================
// Domain Schemas
// ============================================================================

export const domainSchema = z.object({
  id: uuidSchema,
  key: z.string().min(1).max(50).regex(/^[a-z_]+$/, 'Key must be lowercase with underscores'),
  name: z.string().min(1).max(100),
  icon: z.string().max(50).nullable(),
  created_at: isoDateTimeSchema,
});

export const domainArraySchema = z.array(domainSchema);

// ============================================================================
// Subject Schemas
// ============================================================================

export const subjectSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  domain_id: uuidSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  is_active: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const subjectInsertSchema = z.object({
  user_id: uuidSchema,
  domain_id: uuidSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional().default(true),
});

export const subjectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const subjectArraySchema = z.array(subjectSchema);

export const subjectWithStatsSchema = subjectSchema.extend({
  entry_count: z.number().int().min(0),
  last_entry_date: isoDateSchema.nullable(),
});

// ============================================================================
// Entry Schemas
// ============================================================================

export const entrySchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  subject_id: uuidSchema,
  performed_at: isoDateSchema,
  notes: z.string().max(1000).nullable(),
  is_completed: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const entryInsertSchema = z.object({
  user_id: uuidSchema,
  subject_id: uuidSchema,
  performed_at: isoDateSchema,
  notes: z.string().max(1000).nullable().optional(),
  is_completed: z.boolean().optional().default(false),
});

export const entryUpdateSchema = z.object({
  performed_at: isoDateSchema.optional(),
  notes: z.string().max(1000).nullable().optional(),
  is_completed: z.boolean().optional(),
});

export const entryArraySchema = z.array(entrySchema);

// ============================================================================
// Item Schemas
// ============================================================================

export const itemSchema = z.object({
  id: uuidSchema,
  entry_id: uuidSchema,
  user_id: uuidSchema,
  name: z.string().min(1).max(100),
  position: z.number().int().min(0),
  created_at: isoDateTimeSchema,
});

export const itemInsertSchema = z.object({
  entry_id: uuidSchema,
  user_id: uuidSchema,
  name: z.string().min(1).max(100),
  position: z.number().int().min(0),
});

export const itemUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
});

export const itemArraySchema = z.array(itemSchema);

// ============================================================================
// Item Set Schemas
// ============================================================================

export const itemSetSchema = z.object({
  id: uuidSchema,
  item_id: uuidSchema,
  user_id: uuidSchema,
  set_index: z.number().int().min(0),
  weight_kg: z.number().min(0).max(1000).nullable(),
  reps: z.number().int().min(0).max(1000).nullable(),
  duration_sec: z.number().int().min(0).max(86400).nullable(), // max 24 hours
  distance_m: z.number().int().min(0).max(100000).nullable(), // max 100km
  notes: z.string().max(500).nullable(),
  created_at: isoDateTimeSchema,
});

export const itemSetInsertSchema = z.object({
  item_id: uuidSchema,
  user_id: uuidSchema,
  set_index: z.number().int().min(0),
  weight_kg: z.number().min(0).max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  duration_sec: z.number().int().min(0).max(86400).nullable().optional(),
  distance_m: z.number().int().min(0).max(100000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const itemSetUpdateSchema = z.object({
  set_index: z.number().int().min(0).optional(),
  weight_kg: z.number().min(0).max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  duration_sec: z.number().int().min(0).max(86400).nullable().optional(),
  distance_m: z.number().int().min(0).max(100000).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const itemSetArraySchema = z.array(itemSetSchema);

// ============================================================================
// Item Feedback Schemas
// ============================================================================

export const itemFeedbackSchema = z.object({
  id: uuidSchema,
  item_id: uuidSchema,
  user_id: uuidSchema,
  rating: feedbackRatingSchema,
  comment: z.string().max(500).nullable(),
  created_at: isoDateTimeSchema,
});

export const itemFeedbackInsertSchema = z.object({
  item_id: uuidSchema,
  user_id: uuidSchema,
  rating: feedbackRatingSchema,
  comment: z.string().max(500).nullable().optional(),
});

export const itemFeedbackUpdateSchema = z.object({
  rating: feedbackRatingSchema.optional(),
  comment: z.string().max(500).nullable().optional(),
});

// ============================================================================
// Goal Schemas
// ============================================================================

export const goalTargetSchema = z.object({
  weight_kg: z.number().min(0).max(1000).optional(),
  reps: z.number().int().min(0).max(1000).optional(),
  sets: z.number().int().min(1).max(100).optional(),
  duration_sec: z.number().int().min(0).max(86400).optional(),
  distance_m: z.number().int().min(0).max(100000).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: 'Goal target must have at least one property set' }
);

export const goalSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  subject_id: uuidSchema,
  item_name: z.string().min(1).max(100),
  target: goalTargetSchema,
  achieved_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const goalInsertSchema = z.object({
  user_id: uuidSchema,
  subject_id: uuidSchema,
  item_name: z.string().min(1).max(100),
  target: goalTargetSchema,
});

export const goalUpdateSchema = z.object({
  item_name: z.string().min(1).max(100).optional(),
  target: goalTargetSchema.optional(),
  achieved_at: isoDateTimeSchema.nullable().optional(),
});

export const goalArraySchema = z.array(goalSchema);

// ============================================================================
// Composite Schemas (with relations)
// ============================================================================

export const itemWithSetsSchema = itemSchema.extend({
  sets: itemSetArraySchema,
  feedback: itemFeedbackSchema.nullable(),
});

export const entryWithItemsSchema = entrySchema.extend({
  items: z.array(itemWithSetsSchema),
});

// ============================================================================
// Pagination Schemas
// ============================================================================

export const paginationParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
    hasMore: z.boolean(),
  });
}
