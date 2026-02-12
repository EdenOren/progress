import { getSupabase, type Database } from '../supabase/client';
import type { Entry, EntryInsert, EntryUpdate, EntryWithItems } from '../types/domain';
import {
  entrySchema,
  entryArraySchema,
  entryInsertSchema,
  entryWithItemsSchema,
} from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError, NotFoundError } from '../errors/index';
import { logWarn } from '../utils/logger';

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
 * @param excludeEntryId - Entry ID to exclude (the current session)
 */
export async function getLastEntryForSubject(
  userId: string,
  subjectId: string,
  excludeEntryId?: string
): Promise<Result<EntryWithItems | null>> {
  const supabase = getSupabase();

  let query = supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('is_completed', true)  // Only get completed entries for comparison
    .order('performed_at', { ascending: false })
    .order('created_at', { ascending: false })  // Secondary sort for same-day entries
    .limit(1);

  // Exclude the current entry by ID (more reliable than date comparison)
  if (excludeEntryId) {
    query = query.neq('id', excludeEntryId);
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
 * Get a single entry by ordinal number (per-subject)
 */
export async function getEntryByOrdinal(
  userId: string,
  subjectId: string,
  ordinal: number
): Promise<Result<Entry>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('ordinal', ordinal)
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
 * Get entry with items by ordinal number (per-subject)
 * Resolves ordinal to UUID, then fetches full entry with items
 */
export async function getEntryWithItemsByOrdinal(
  userId: string,
  subjectId: string,
  ordinal: number
): Promise<Result<EntryWithItems>> {
  const entryResult = await getEntryByOrdinal(userId, subjectId, ordinal);
  if (!entryResult.success) {
    return entryResult;
  }

  return getEntryWithItems(userId, entryResult.data.id);
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
    // Handle "no rows returned" - entry may have been deleted
    if (error.code === 'PGRST116') {
      return err(new NotFoundError('Session'));
    }
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

/**
 * Template item structure for creating entry with items
 */
interface TemplateItemForEntry {
  exercise_id: string;
  name: string;
  tracking_type: 'weight_reps' | 'duration' | 'distance';
  default_sets: Array<{
    target_reps?: number;
    target_duration_seconds?: number;
  }>;
}

/**
 * Create an entry and populate items from template
 * This is the main function for starting a new session
 * Auto-copies weight/distance values from the last completed session
 */
export async function createEntryWithTemplate(
  input: EntryInsert,
  templateItems: TemplateItemForEntry[]
): Promise<Result<Entry>> {
  // First create the entry
  const entryResult = await createEntry(input);
  if (!entryResult.success) {
    return entryResult;
  }

  const entry = entryResult.data;

  // If no template items, just return the entry
  if (templateItems.length === 0) {
    return ok(entry);
  }

  const supabase = getSupabase();

  // Fetch last completed session for this subject to copy weight/distance values
  const lastSessionResult = await getLastCompletedSession(input.user_id, input.subject_id);
  const lastSession = lastSessionResult.success ? lastSessionResult.data : null;

  // Build a map of exercise_id -> last session's sets for quick lookup
  const lastSessionSetsByExercise = new Map<string, Array<{
    set_index: number;
    weight_kg: number | null;
    distance_m: number | null;
  }>>();

  if (lastSession) {
    for (const item of lastSession.items) {
      if (item.exercise_id) {
        lastSessionSetsByExercise.set(item.exercise_id, item.sets.map(s => ({
          set_index: s.set_index,
          weight_kg: s.weight_kg,
          distance_m: s.distance_m,
        })));
      }
    }
  }

  // Create items from template
  const itemsToInsert = templateItems.map((template, index) => ({
    entry_id: entry.id,
    user_id: input.user_id,
    name: template.name,
    position: index,
    exercise_id: template.exercise_id,
    is_from_template: true,
    tracking_type: template.tracking_type,
  }));

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) {
    // Entry was created but items failed - delete entry to rollback
    await supabase.from('entries').delete().eq('id', entry.id);
    return err(mapSupabaseError(itemsError));
  }

  // Create sets for each item based on template default_sets
  // Pre-fill reps/duration with target values and weight/distance from last session
  const setsToInsert: Array<{
    item_id: string;
    user_id: string;
    set_index: number;
    target_reps: number | null;
    target_duration_sec: number | null;
    reps: number | null;
    duration_sec: number | null;
    weight_kg: number | null;
    distance_m: number | null;
  }> = [];

  // Type assertion for items returned from insert
  type InsertedItem = { id: string };
  const typedItems = items as InsertedItem[];

  for (let i = 0; i < typedItems.length; i++) {
    const item = typedItems[i];
    const template = templateItems[i];

    if (item && template) {
      // Get last session's sets for this exercise
      const lastSets = lastSessionSetsByExercise.get(template.exercise_id) ?? [];

      template.default_sets.forEach((setConfig, setIndex) => {
        // Find matching set from last session by set_index
        const lastSet = lastSets.find(s => s.set_index === setIndex);

        setsToInsert.push({
          item_id: item.id,
          user_id: input.user_id,
          set_index: setIndex,
          target_reps: setConfig.target_reps ?? null,
          target_duration_sec: setConfig.target_duration_seconds ?? null,
          // Pre-fill actual values with targets so user only needs to enter weight
          reps: setConfig.target_reps ?? null,
          duration_sec: setConfig.target_duration_seconds ?? null,
          // Copy weight and distance from last session
          weight_kg: lastSet?.weight_kg ?? null,
          distance_m: lastSet?.distance_m ?? null,
        });
      });
    }
  }

  if (setsToInsert.length > 0) {
    const { error: setsError } = await supabase
      .from('item_sets')
      .insert(setsToInsert);

    if (setsError) {
      // Log but don't fail - entry and items were created successfully
      logWarn('Failed to create template sets', { error: setsError });
    }
  }

  return ok(entry);
}

/**
 * Get the most recent completed entry for a subject (for auto-copying data)
 */
async function getLastCompletedSession(
  userId: string,
  subjectId: string
): Promise<Result<EntryWithItems | null>> {
  const supabase = getSupabase();

  // Get the last completed entry
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('is_completed', true)
    .order('performed_at', { ascending: false })
    .limit(1)
    .single();

  if (entryError) {
    if (entryError.code === 'PGRST116') {
      return ok(null); // No previous completed entry
    }
    return err(mapSupabaseError(entryError));
  }

  if (!entry) {
    return ok(null);
  }

  // Type assertion for query result
  type EntryRow = Database['public']['Tables']['entries']['Row'];
  const typedEntry = entry as EntryRow;

  // Get full entry with items
  return getEntryWithItems(userId, typedEntry.id);
}
