import { getSupabase } from '../supabase/client';
import type {
  Item,
  ItemInsert,
  ItemUpdate,
  ItemSet,
  ItemSetInsert,
  ItemSetUpdate,
  ItemFeedback,
  ItemFeedbackInsert,
  ItemFeedbackUpdate,
  ItemWithSets,
} from '../types/domain';
import {
  itemSchema,
  itemArraySchema,
  itemInsertSchema,
  itemSetSchema,
  itemSetArraySchema,
  itemSetInsertSchema,
  itemFeedbackSchema,
  itemFeedbackInsertSchema,
  itemWithSetsSchema,
} from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';
import type { Database } from '../supabase/client';

// Type for raw Supabase query result with nested relations
type RawItemRow = Database['public']['Tables']['items']['Row'];
type RawSetRow = Database['public']['Tables']['item_sets']['Row'];
type RawFeedbackRow = Database['public']['Tables']['item_feedback']['Row'];

interface ItemWithRelations extends RawItemRow {
  sets: RawSetRow[];
  feedback: RawFeedbackRow[];
}

// ============================================================================
// ITEMS
// ============================================================================

/**
 * Get all items for an entry
 */
export async function getItemsByEntry(
  userId: string,
  entryId: string
): Promise<Result<Item[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_id', entryId)
    .order('position', { ascending: true });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get item with sets and feedback
 */
export async function getItemWithSets(
  userId: string,
  itemId: string
): Promise<Result<ItemWithSets>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      sets:item_sets(*),
      feedback:item_feedback(*)
    `)
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  // Type assertion for nested relations query
  const item = data as unknown as ItemWithRelations;

  const itemWithSets = {
    ...item,
    sets: item.sets ?? [],
    feedback: Array.isArray(item.feedback) && item.feedback.length > 0
      ? item.feedback[0]
      : null,
  };

  const parsed = itemWithSetsSchema.safeParse(itemWithSets);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create a new item
 */
export async function createItem(input: ItemInsert): Promise<Result<Item>> {
  const validatedInput = itemInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('items')
    .insert(validatedInput.data)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update an item
 */
export async function updateItem(
  userId: string,
  itemId: string,
  updates: ItemUpdate
): Promise<Result<Item>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Delete an item (cascades to sets and feedback)
 */
export async function deleteItem(
  userId: string,
  itemId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}

/**
 * Reorder items within an entry
 */
export async function reorderItems(
  userId: string,
  entryId: string,
  itemIds: string[]
): Promise<Result<void>> {
  const supabase = getSupabase();

  // Update positions in a transaction-like manner
  const updates = itemIds.map((id, index) =>
    supabase
      .from('items')
      .update({ position: index })
      .eq('id', id)
      .eq('user_id', userId)
      .eq('entry_id', entryId)
  );

  const results = await Promise.all(updates);
  const errorResult = results.find((r) => r.error);

  if (errorResult?.error) {
    return err(mapSupabaseError(errorResult.error));
  }

  return ok(undefined);
}

// ============================================================================
// ITEM SETS
// ============================================================================

/**
 * Get all sets for an item
 */
export async function getSetsByItem(
  userId: string,
  itemId: string
): Promise<Result<ItemSet[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_sets')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .order('set_index', { ascending: true });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemSetArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create a new set
 */
export async function createSet(input: ItemSetInsert): Promise<Result<ItemSet>> {
  const validatedInput = itemSetInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_sets')
    .insert(validatedInput.data)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemSetSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update a set
 */
export async function updateSet(
  userId: string,
  setId: string,
  updates: ItemSetUpdate
): Promise<Result<ItemSet>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_sets')
    .update(updates)
    .eq('id', setId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemSetSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Delete a set
 */
export async function deleteSet(
  userId: string,
  setId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('item_sets')
    .delete()
    .eq('id', setId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}

/**
 * Create multiple sets at once
 */
export async function createSets(inputs: ItemSetInsert[]): Promise<Result<ItemSet[]>> {
  const validatedInputs = inputs.map((input) => itemSetInsertSchema.safeParse(input));
  const invalidInput = validatedInputs.find((v) => !v.success);

  if (invalidInput && !invalidInput.success) {
    return err(new ValidationError(invalidInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_sets')
    .insert(validatedInputs.map((v) => v.data as ItemSetInsert))
    .select();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemSetArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

// ============================================================================
// ITEM FEEDBACK
// ============================================================================

/**
 * Get feedback for an item
 */
export async function getFeedbackByItem(
  userId: string,
  itemId: string
): Promise<Result<ItemFeedback | null>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_feedback')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return ok(null);
    }
    return err(mapSupabaseError(error));
  }

  const parsed = itemFeedbackSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create or update feedback for an item (upsert)
 */
export async function setFeedback(input: ItemFeedbackInsert): Promise<Result<ItemFeedback>> {
  const validatedInput = itemFeedbackInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_feedback')
    .upsert(validatedInput.data, { onConflict: 'item_id' })
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemFeedbackSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update feedback
 */
export async function updateFeedback(
  userId: string,
  feedbackId: string,
  updates: ItemFeedbackUpdate
): Promise<Result<ItemFeedback>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('item_feedback')
    .update(updates)
    .eq('id', feedbackId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = itemFeedbackSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Delete feedback
 */
export async function deleteFeedback(
  userId: string,
  feedbackId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('item_feedback')
    .delete()
    .eq('id', feedbackId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}
