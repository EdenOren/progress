import { getSupabase } from '../supabase/client';
import type { Exercise, ExerciseInsert, ExerciseIcon } from '../types/domain';
import { exerciseSchema, exerciseArraySchema, exerciseInsertSchema } from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Search exercises by name (system + user's custom)
 * Used for autocomplete when adding exercises to workouts
 */
export async function searchExercises(
  query: string,
  userId: string
): Promise<Result<Exercise[]>> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exercise_library')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${userId}`)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20);

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = exerciseArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get all exercises visible to a user (system + custom)
 */
export async function getAllExercises(userId: string): Promise<Result<Exercise[]>> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exercise_library')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${userId}`)
    .order('muscle_group')
    .order('name');

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = exerciseArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get exercises filtered by muscle group
 */
export async function getExercisesByMuscleGroup(
  userId: string,
  muscleGroup: string
): Promise<Result<Exercise[]>> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exercise_library')
    .select('*')
    .or(`is_system.eq.true,created_by.eq.${userId}`)
    .eq('muscle_group', muscleGroup)
    .order('name');

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = exerciseArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a single exercise by ID
 */
export async function getExerciseById(
  exerciseId: string,
  userId: string
): Promise<Result<Exercise>> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exercise_library')
    .select('*')
    .eq('id', exerciseId)
    .or(`is_system.eq.true,created_by.eq.${userId}`)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = exerciseSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create a custom exercise
 */
export async function createCustomExercise(
  input: Omit<ExerciseInsert, 'created_by'>,
  userId: string
): Promise<Result<Exercise>> {
  const fullInput: ExerciseInsert = {
    ...input,
    created_by: userId,
  };

  const validatedInput = exerciseInsertSchema.safeParse(fullInput);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exercise_library')
    .insert({
      ...validatedInput.data,
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = exerciseSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Delete a custom exercise (only allowed for user's own exercises)
 */
export async function deleteCustomExercise(
  exerciseId: string,
  userId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('exercise_library')
    .delete()
    .eq('id', exerciseId)
    .eq('created_by', userId)
    .eq('is_system', false);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}

/**
 * Update a custom exercise icon (only allowed for user's own exercises)
 */
export async function updateExerciseIcon(
  exerciseId: string,
  icon: ExerciseIcon,
  userId: string
): Promise<Result<Exercise>> {
  const supabase = getSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('exercise_library')
    .update({ icon })
    .eq('id', exerciseId)
    .eq('created_by', userId)
    .eq('is_system', false)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = exerciseSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}
