import { getSupabase } from '../supabase/client';
import type { Goal, GoalInsert, GoalUpdate } from '../types/domain';
import {
  goalSchema,
  goalArraySchema,
  goalInsertSchema,
} from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Get all goals for a user
 */
export async function getGoals(userId: string): Promise<Result<Goal[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .is('achieved_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = goalArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get goals for a subject
 */
export async function getGoalsBySubject(
  userId: string,
  subjectId: string
): Promise<Result<Goal[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .is('achieved_at', null)
    .order('item_name', { ascending: true });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = goalArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a goal for a specific item in a subject
 */
export async function getGoalForItem(
  userId: string,
  subjectId: string,
  itemName: string
): Promise<Result<Goal | null>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('item_name', itemName)
    .is('achieved_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return ok(null);
    }
    return err(mapSupabaseError(error));
  }

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get achieved goals for a user
 */
export async function getAchievedGoals(
  userId: string,
  limit: number = 20
): Promise<Result<Goal[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .not('achieved_at', 'is', null)
    .order('achieved_at', { ascending: false })
    .limit(limit);

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = goalArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create a new goal
 */
export async function createGoal(input: GoalInsert): Promise<Result<Goal>> {
  const validatedInput = goalInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('goals')
    .insert(validatedInput.data)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update a goal
 */
export async function updateGoal(
  userId: string,
  goalId: string,
  updates: GoalUpdate
): Promise<Result<Goal>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('goals')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Mark a goal as achieved
 */
export async function achieveGoal(
  userId: string,
  goalId: string
): Promise<Result<Goal>> {
  return updateGoal(userId, goalId, {
    achieved_at: new Date().toISOString(),
  });
}

/**
 * Create or update a goal for an item (upsert)
 */
export async function setGoal(input: GoalInsert): Promise<Result<Goal>> {
  const validatedInput = goalInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  // Upsert based on user_id + subject_id + item_name
  const { data, error } = await supabase
    .from('goals')
    .upsert(
      {
        ...validatedInput.data,
        achieved_at: null, // Reset achieved status on update
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,subject_id,item_name' }
    )
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Delete a goal
 */
export async function deleteGoal(
  userId: string,
  goalId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}
