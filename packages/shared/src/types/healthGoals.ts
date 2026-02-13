/**
 * Health Goals types for the Progress app.
 * Single-row-per-user targets used by KPI dashboard.
 */

import type { UUID, ISODateTime } from './domain';

// ============================================================================
// Health Goals
// ============================================================================

/** Health goals record (one per user) */
export interface HealthGoals {
  id: UUID;
  user_id: UUID;
  sleep_target_hours: number | null;
  water_target_liters: number | null;
  weight_target_kg: number | null;
  waist_target_cm: number | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

/** Health goals creation/upsert input */
export interface HealthGoalsUpsert {
  sleep_target_hours?: number | null;
  water_target_liters?: number | null;
  weight_target_kg?: number | null;
  waist_target_cm?: number | null;
}
