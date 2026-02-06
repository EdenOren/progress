import { getSupabase } from '../supabase/client';
import type { WorkoutTemplate, WorkoutTemplateInsert, WorkoutTemplateUpdate, WorkoutTemplateWithExercise } from '../types/domain';
import { workoutTemplateSchema, workoutTemplateInsertSchema, workoutTemplateWithExerciseArraySchema } from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Get workout template for a subject (with exercise details)
 */
export async function getWorkoutTemplate(
  subjectId: string
): Promise<Result<WorkoutTemplateWithExercise[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('workout_templates')
    .select(`
      *,
      exercise:exercise_library(*)
    `)
    .eq('subject_id', subjectId)
    .eq('is_active', true)
    .order('position');

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = workoutTemplateWithExerciseArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Add exercise to workout template
 */
export async function addToTemplate(
  input: WorkoutTemplateInsert
): Promise<Result<WorkoutTemplate>> {
  const validatedInput = workoutTemplateInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('workout_templates')
    .insert(validatedInput.data)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = workoutTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Add multiple exercises to workout template in one call
 */
export async function addMultipleToTemplate(
  inputs: WorkoutTemplateInsert[]
): Promise<Result<WorkoutTemplate[]>> {
  if (inputs.length === 0) {
    return ok([]);
  }

  // Validate all inputs
  const validatedInputs: WorkoutTemplateInsert[] = [];
  for (const input of inputs) {
    const validated = workoutTemplateInsertSchema.safeParse(input);
    if (!validated.success) {
      return err(new ValidationError(validated.error));
    }
    validatedInputs.push(validated.data);
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('workout_templates')
    .insert(validatedInputs)
    .select();

  if (error) {
    return err(mapSupabaseError(error));
  }

  // Validate response as array
  const results: WorkoutTemplate[] = [];
  for (const item of data) {
    const parsed = workoutTemplateSchema.safeParse(item);
    if (!parsed.success) {
      return err(new ValidationError(parsed.error));
    }
    results.push(parsed.data);
  }

  return ok(results);
}

/**
 * Update template item (default sets, position, etc.)
 */
export async function updateTemplateItem(
  templateItemId: string,
  updates: WorkoutTemplateUpdate
): Promise<Result<WorkoutTemplate>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('workout_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', templateItemId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = workoutTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Remove exercise from template (soft delete)
 */
export async function removeFromTemplate(
  templateItemId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('workout_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', templateItemId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}

/**
 * Hard delete exercise from template
 */
export async function hardRemoveFromTemplate(
  templateItemId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateItemId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}

/**
 * Reorder template items
 */
export async function reorderTemplate(
  subjectId: string,
  orderedIds: string[]
): Promise<Result<void>> {
  const supabase = getSupabase();

  // Update positions based on array order
  for (let i = 0; i < orderedIds.length; i++) {
    const id = orderedIds[i];
    if (!id) continue; // TypeScript guard

    const { error } = await supabase
      .from('workout_templates')
      .update({ position: i, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('subject_id', subjectId);

    if (error) {
      return err(mapSupabaseError(error));
    }
  }

  return ok(undefined);
}

/**
 * Get next available position for a template item
 */
export async function getNextTemplatePosition(
  subjectId: string
): Promise<Result<number>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('workout_templates')
    .select('position')
    .eq('subject_id', subjectId)
    .order('position', { ascending: false })
    .limit(1);

  if (error) {
    return err(mapSupabaseError(error));
  }

  const maxPosition = (data as Array<{ position: number }> | null)?.[0]?.position ?? -1;
  return ok(maxPosition + 1);
}
