import { getSupabase } from '../supabase/client';
import type { DailyLogEntry, DailyLogEntryInsert, DailyLogEntryUpdate } from '../types/dailyLog';
import {
  dailyLogEntrySchema,
  dailyLogEntryArraySchema,
  dailyLogEntryInsertSchema,
} from '../schemas/dailyLog';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError, NotFoundError } from '../errors/index';

/**
 * Get daily log entries for a user, ordered by date descending
 */
export async function getDailyLogEntries(
  userId: string,
  limit: number = 30
): Promise<Result<DailyLogEntry[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('daily_log_entries')
    .select('*')
    .eq('user_id', userId)
    .order('logged_date', { ascending: false })
    .limit(limit);

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = dailyLogEntryArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a daily log entry by date
 */
export async function getDailyLogEntryByDate(
  userId: string,
  date: string
): Promise<Result<DailyLogEntry | null>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('daily_log_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_date', date)
    .maybeSingle();

  if (error) {
    return err(mapSupabaseError(error));
  }

  if (!data) {
    return ok(null);
  }

  const parsed = dailyLogEntrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a daily log entry by ID
 */
export async function getDailyLogEntryById(
  userId: string,
  entryId: string
): Promise<Result<DailyLogEntry>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('daily_log_entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = dailyLogEntrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create or update a daily log entry (upsert by date)
 */
export async function upsertDailyLogEntry(
  userId: string,
  input: DailyLogEntryInsert
): Promise<Result<DailyLogEntry>> {
  // Validate input
  const validatedInput = dailyLogEntryInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  // Use upsert with the unique constraint on (user_id, logged_date)
  const { data, error } = await supabase
    .from('daily_log_entries')
    .upsert(
      {
        user_id: userId,
        logged_date: validatedInput.data.logged_date,
        sleep_hours: validatedInput.data.sleep_hours ?? null,
        weight_kg: validatedInput.data.weight_kg ?? null,
        body_fat_percent: validatedInput.data.body_fat_percent ?? null,
        notes: validatedInput.data.notes ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,logged_date',
      }
    )
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = dailyLogEntrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update a daily log entry by ID
 */
export async function updateDailyLogEntry(
  userId: string,
  entryId: string,
  updates: DailyLogEntryUpdate
): Promise<Result<DailyLogEntry>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('daily_log_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return err(new NotFoundError('Daily log entry'));
    }
    return err(mapSupabaseError(error));
  }

  const parsed = dailyLogEntrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Delete a daily log entry
 */
export async function deleteDailyLogEntry(
  userId: string,
  entryId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('daily_log_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}
