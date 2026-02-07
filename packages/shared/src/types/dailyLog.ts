/**
 * Daily Log types for the Progress app.
 * Tracks daily health metrics: sleep, weight, body fat percentage.
 */

import type { UUID, ISODate, ISODateTime } from './domain';

// ============================================================================
// Daily Log Entry
// ============================================================================

/** Daily log entry for health metrics */
export interface DailyLogEntry {
  id: UUID;
  user_id: UUID;
  logged_date: ISODate;
  sleep_hours: number | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Daily log entry creation/upsert input */
export interface DailyLogEntryInsert {
  logged_date: ISODate;
  sleep_hours?: number | null;
  weight_kg?: number | null;
  body_fat_percent?: number | null;
  notes?: string | null;
}

/** Daily log entry update input */
export interface DailyLogEntryUpdate {
  sleep_hours?: number | null;
  weight_kg?: number | null;
  body_fat_percent?: number | null;
  notes?: string | null;
}
