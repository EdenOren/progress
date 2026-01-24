/**
 * Domain types for the Progress app.
 * These interfaces represent the core entities in the system.
 */

// ============================================================================
// Common Types
// ============================================================================

/** UUID string type for IDs */
export type UUID = string;

/** ISO 8601 date-time string */
export type ISODateTime = string;

/** ISO 8601 date string (YYYY-MM-DD) */
export type ISODate = string;

/** Rating for item feedback */
export type FeedbackRating = 'success' | 'hard' | 'fail';

// ============================================================================
// Profile
// ============================================================================

/** User profile */
export interface Profile {
  id: UUID;
  display_name: string;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Profile creation/update input */
export interface ProfileInsert {
  id: UUID;
  display_name: string;
  avatar_url?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

// ============================================================================
// Domain (Workout, Nutrition, etc.)
// ============================================================================

/** Tracking domain (e.g., workout, nutrition, sleep) */
export interface Domain {
  id: UUID;
  key: string;
  name: string;
  icon: string | null;
  created_at: ISODateTime;
}

// ============================================================================
// Subject
// ============================================================================

/** User's custom routine/bucket (e.g., "Monday Practice") */
export interface Subject {
  id: UUID;
  user_id: UUID;
  domain_id: UUID;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Subject creation input */
export interface SubjectInsert {
  user_id: UUID;
  domain_id: UUID;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

/** Subject update input */
export interface SubjectUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

/** Subject with related data */
export interface SubjectWithStats extends Subject {
  entry_count: number;
  last_entry_date: ISODate | null;
}

// ============================================================================
// Entry
// ============================================================================

/** Performed instance of a subject */
export interface Entry {
  id: UUID;
  user_id: UUID;
  subject_id: UUID;
  performed_at: ISODate;
  notes: string | null;
  is_completed: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Entry creation input */
export interface EntryInsert {
  user_id: UUID;
  subject_id: UUID;
  performed_at: ISODate;
  notes?: string | null;
  is_completed?: boolean;
}

/** Entry update input */
export interface EntryUpdate {
  performed_at?: ISODate;
  notes?: string | null;
  is_completed?: boolean;
}

/** Entry with all related items */
export interface EntryWithItems extends Entry {
  items: ItemWithSets[];
}

// ============================================================================
// Item
// ============================================================================

/** Drill/exercise within an entry */
export interface Item {
  id: UUID;
  entry_id: UUID;
  user_id: UUID;
  name: string;
  position: number;
  created_at: ISODateTime;
}

/** Item creation input */
export interface ItemInsert {
  entry_id: UUID;
  user_id: UUID;
  name: string;
  position: number;
}

/** Item update input */
export interface ItemUpdate {
  name?: string;
  position?: number;
}

/** Item with its sets and feedback */
export interface ItemWithSets extends Item {
  sets: ItemSet[];
  feedback: ItemFeedback | null;
}

// ============================================================================
// Item Set
// ============================================================================

/** Individual set record (weight, reps, etc.) */
export interface ItemSet {
  id: UUID;
  item_id: UUID;
  user_id: UUID;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  duration_sec: number | null;
  distance_m: number | null;
  notes: string | null;
  created_at: ISODateTime;
}

/** ItemSet creation input */
export interface ItemSetInsert {
  item_id: UUID;
  user_id: UUID;
  set_index: number;
  weight_kg?: number | null;
  reps?: number | null;
  duration_sec?: number | null;
  distance_m?: number | null;
  notes?: string | null;
}

/** ItemSet update input */
export interface ItemSetUpdate {
  set_index?: number;
  weight_kg?: number | null;
  reps?: number | null;
  duration_sec?: number | null;
  distance_m?: number | null;
  notes?: string | null;
}

// ============================================================================
// Item Feedback
// ============================================================================

/** Feedback for an item (success/hard/fail) */
export interface ItemFeedback {
  id: UUID;
  item_id: UUID;
  user_id: UUID;
  rating: FeedbackRating;
  comment: string | null;
  created_at: ISODateTime;
}

/** ItemFeedback creation input */
export interface ItemFeedbackInsert {
  item_id: UUID;
  user_id: UUID;
  rating: FeedbackRating;
  comment?: string | null;
}

/** ItemFeedback update input */
export interface ItemFeedbackUpdate {
  rating?: FeedbackRating;
  comment?: string | null;
}

// ============================================================================
// Goal
// ============================================================================

/** Target goal for a specific item in a subject */
export interface Goal {
  id: UUID;
  user_id: UUID;
  subject_id: UUID;
  item_name: string;
  target: GoalTarget;
  achieved_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Flexible goal target (stored as JSONB) */
export interface GoalTarget {
  weight_kg?: number;
  reps?: number;
  sets?: number;
  duration_sec?: number;
  distance_m?: number;
  notes?: string;
  // Index signature for compatibility with Record<string, unknown>
  [key: string]: number | string | undefined;
}

/** Goal creation input */
export interface GoalInsert {
  user_id: UUID;
  subject_id: UUID;
  item_name: string;
  target: GoalTarget;
}

/** Goal update input */
export interface GoalUpdate {
  item_name?: string;
  target?: GoalTarget;
  achieved_at?: ISODateTime | null;
}

// ============================================================================
// Utility Types
// ============================================================================

/** Database row with common fields */
export interface BaseRow {
  id: UUID;
  created_at: ISODateTime;
}

/** Database row with user ownership */
export interface UserOwnedRow extends BaseRow {
  user_id: UUID;
}

/** Pagination parameters */
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
