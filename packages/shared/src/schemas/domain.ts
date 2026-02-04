import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/** UUID validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** ISO 8601 date-time string (accepts both Z and +HH:MM offset formats from Supabase) */
export const isoDateTimeSchema = z.string().datetime({ offset: true, message: 'Invalid datetime format' });

/** ISO 8601 date string (YYYY-MM-DD) */
export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format. Expected YYYY-MM-DD'
);

/** Feedback rating: done = completed as expected, up = want to increase weight/reps */
export const feedbackRatingSchema = z.enum(['done', 'up']);

/** Tracking type for exercises */
export const trackingTypeSchema = z.enum(['weight_reps', 'duration', 'distance']);

/** Exercise category */
export const exerciseCategorySchema = z.enum(['strength', 'bodyweight', 'cardio', 'flexibility']);

/** Muscle group */
export const muscleGroupSchema = z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body']);

/** Exercise icon (MaterialCommunityIcons) */
export const exerciseIconSchema = z.enum([
  // Strength
  'dumbbell',
  'weight-lifter',
  'arm-flex',
  'weight',
  'barbell',
  // Body positions
  'human-handsup',
  'human',
  'human-handsdown',
  'yoga',
  'meditation',
  'kabaddi',
  'karate',
  // Cardio
  'run',
  'run-fast',
  'walk',
  'bike',
  'rowing',
  'swim',
  'jump-rope',
  // Equipment
  'stairs-up',
  'stairs',
  'gymnastics',
  'boxing-glove',
  'basketball',
  'soccer',
  'tennis',
  // Other
  'heart-pulse',
  'timer-outline',
  'stretch',
]);

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
// Template Set Config Schema (defined early for use in Subject)
// ============================================================================

export const templateSetConfigSchema = z.object({
  target_reps: z.number().int().min(1).max(1000).optional(),
  target_duration_seconds: z.number().int().min(1).max(86400).optional(),
});

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
  default_sets: z.array(templateSetConfigSchema).default([{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }]),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const subjectInsertSchema = z.object({
  user_id: uuidSchema,
  domain_id: uuidSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional().default(true),
  default_sets: z.array(templateSetConfigSchema).optional(),
});

export const subjectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  is_active: z.boolean().optional(),
  default_sets: z.array(templateSetConfigSchema).optional(),
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
  duration_seconds: z.number().int().min(0).nullable(),
  started_at: isoDateTimeSchema.nullable(),
  completed_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const entryInsertSchema = z.object({
  user_id: uuidSchema,
  subject_id: uuidSchema,
  performed_at: isoDateSchema,
  notes: z.string().max(1000).nullable().optional(),
  is_completed: z.boolean().optional().default(false),
  duration_seconds: z.number().int().min(0).nullable().optional(),
  started_at: isoDateTimeSchema.nullable().optional(),
  completed_at: isoDateTimeSchema.nullable().optional(),
});

export const entryUpdateSchema = z.object({
  performed_at: isoDateSchema.optional(),
  notes: z.string().max(1000).nullable().optional(),
  is_completed: z.boolean().optional(),
  duration_seconds: z.number().int().min(0).nullable().optional(),
  started_at: isoDateTimeSchema.nullable().optional(),
  completed_at: isoDateTimeSchema.nullable().optional(),
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
  exercise_id: uuidSchema.nullable(),
  is_from_template: z.boolean(),
  tracking_type: trackingTypeSchema,
  note: z.string().max(1000).nullable().optional(),
  created_at: isoDateTimeSchema,
});

export const itemInsertSchema = z.object({
  entry_id: uuidSchema,
  user_id: uuidSchema,
  name: z.string().min(1).max(100),
  position: z.number().int().min(0),
  exercise_id: uuidSchema.nullable().optional(),
  is_from_template: z.boolean().optional().default(true),
  tracking_type: trackingTypeSchema.optional().default('weight_reps'),
  note: z.string().max(1000).nullable().optional(),
});

export const itemUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  exercise_id: uuidSchema.nullable().optional(),
  is_from_template: z.boolean().optional(),
  tracking_type: trackingTypeSchema.optional(),
  note: z.string().max(1000).nullable().optional(),
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
  target_reps: z.number().int().min(0).max(1000).nullable(),
  target_duration_sec: z.number().int().min(0).max(86400).nullable(),
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
  target_reps: z.number().int().min(0).max(1000).nullable().optional(),
  target_duration_sec: z.number().int().min(0).max(86400).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const itemSetUpdateSchema = z.object({
  set_index: z.number().int().min(0).optional(),
  weight_kg: z.number().min(0).max(1000).nullable().optional(),
  reps: z.number().int().min(0).max(1000).nullable().optional(),
  duration_sec: z.number().int().min(0).max(86400).nullable().optional(),
  distance_m: z.number().int().min(0).max(100000).nullable().optional(),
  target_reps: z.number().int().min(0).max(1000).nullable().optional(),
  target_duration_sec: z.number().int().min(0).max(86400).nullable().optional(),
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
// Exercise Library Schemas
// ============================================================================

export const exerciseSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  icon: exerciseIconSchema,
  category: exerciseCategorySchema,
  muscle_group: muscleGroupSchema,
  tracking_type: trackingTypeSchema,
  is_system: z.boolean(),
  created_by: uuidSchema.nullable(),
  created_at: isoDateTimeSchema,
});

export const exerciseInsertSchema = z.object({
  name: z.string().min(1).max(100),
  icon: exerciseIconSchema,
  category: exerciseCategorySchema,
  muscle_group: muscleGroupSchema,
  tracking_type: trackingTypeSchema,
  created_by: uuidSchema,
});

export const exerciseArraySchema = z.array(exerciseSchema);

// ============================================================================
// Workout Template Schemas
// ============================================================================

export const workoutTemplateSchema = z.object({
  id: uuidSchema,
  subject_id: uuidSchema,
  exercise_id: uuidSchema,
  position: z.number().int().min(0),
  default_sets: z.array(templateSetConfigSchema),
  is_active: z.boolean(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
});

export const workoutTemplateWithExerciseSchema = workoutTemplateSchema.extend({
  exercise: exerciseSchema,
});

export const workoutTemplateInsertSchema = z.object({
  subject_id: uuidSchema,
  exercise_id: uuidSchema,
  position: z.number().int().min(0),
  default_sets: z.array(templateSetConfigSchema).optional().default([{ target_reps: 10 }]),
  is_active: z.boolean().optional().default(true),
});

export const workoutTemplateUpdateSchema = z.object({
  position: z.number().int().min(0).optional(),
  default_sets: z.array(templateSetConfigSchema).optional(),
  is_active: z.boolean().optional(),
});

export const workoutTemplateArraySchema = z.array(workoutTemplateSchema);
export const workoutTemplateWithExerciseArraySchema = z.array(workoutTemplateWithExerciseSchema);

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
