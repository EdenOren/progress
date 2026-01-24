import { getSupabase, type Database } from '../supabase/client';
import type { Entry, EntryInsert, EntryUpdate, EntryWithItems } from '../types/domain';
import {
  entrySchema,
  entryArraySchema,
  entryInsertSchema,
  entryWithItemsSchema,
} from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

// Type for raw Supabase query result with nested relations
type RawItemRow = Database['public']['Tables']['items']['Row'];
type RawSetRow = Database['public']['Tables']['item_sets']['Row'];
type RawFeedbackRow = Database['public']['Tables']['item_feedback']['Row'];

interface ItemWithRelations extends RawItemRow {
  sets: RawSetRow[];
  feedback: RawFeedbackRow[];
}

/**
 * Get all entries for a subject
 */
export async function getEntriesBySubject(
  userId: string,
  subjectId: string
): Promise<Result<Entry[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .order('performed_at', { ascending: false });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = entryArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get recent entries for a user across all subjects
 */
export async function getRecentEntries(
  userId: string,
  limit: number = 10
): Promise<Result<Entry[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(limit);

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = entryArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a single entry by ID
 */
export async function getEntryById(
  userId: string,
  entryId: string
): Promise<Result<Entry>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = entrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get entry with all items, sets, and feedback
 */
export async function getEntryWithItems(
  userId: string,
  entryId: string
): Promise<Result<EntryWithItems>> {
  const supabase = getSupabase();

  // Get entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();

  if (entryError) {
    return err(mapSupabaseError(entryError));
  }

  // Get items with sets and feedback
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select(`
      *,
      sets:item_sets(*),
      feedback:item_feedback(*)
    `)
    .eq('entry_id', entryId)
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (itemsError) {
    return err(mapSupabaseError(itemsError));
  }

  // Type assertion for nested relations query
  const typedItems = (items ?? []) as unknown as ItemWithRelations[];

  // Transform feedback array to single object (one feedback per item)
  const itemsWithFeedback = typedItems.map((item) => ({
    ...item,
    sets: item.sets ?? [],
    feedback: Array.isArray(item.feedback) && item.feedback.length > 0
      ? item.feedback[0]
      : null,
  }));

  const entryWithItems = {
    ...entry,
    items: itemsWithFeedback,
  };

  const parsed = entryWithItemsSchema.safeParse(entryWithItems);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get the most recent entry for a subject (for "last time" comparison)
 */
export async function getLastEntryForSubject(
  userId: string,
  subjectId: string,
  beforeDate?: string
): Promise<Result<EntryWithItems | null>> {
  const supabase = getSupabase();

  let query = supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .order('performed_at', { ascending: false })
    .limit(1);

  if (beforeDate) {
    query = query.lt('performed_at', beforeDate);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return ok(null); // No previous entry
    }
    return err(mapSupabaseError(error));
  }

  if (!data) {
    return ok(null);
  }

  // Type assertion for conditional query result
  type EntryRow = Database['public']['Tables']['entries']['Row'];
  const entry = data as EntryRow;

  // Get full entry with items
  return getEntryWithItems(userId, entry.id);
}

/**
 * Create a new entry
 */
export async function createEntry(input: EntryInsert): Promise<Result<Entry>> {
  const validatedInput = entryInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('entries')
    .insert(validatedInput.data)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = entrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update an entry
 */
export async function updateEntry(
  userId: string,
  entryId: string,
  updates: EntryUpdate
): Promise<Result<Entry>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', entryId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = entrySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Mark entry as completed
 */
export async function completeEntry(
  userId: string,
  entryId: string
): Promise<Result<Entry>> {
  return updateEntry(userId, entryId, { is_completed: true });
}

/**
 * Delete an entry (cascades to items, sets, feedback)
 */
export async function deleteEntry(
  userId: string,
  entryId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}
