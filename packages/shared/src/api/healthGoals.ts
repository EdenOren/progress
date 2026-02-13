import { getSupabase } from '../supabase/client';
import type { HealthGoals, HealthGoalsUpsert } from '../types/healthGoals';
import { healthGoalsSchema, healthGoalsUpsertSchema } from '../schemas/healthGoals';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Get the current user's health goals
 */
export async function getHealthGoals(userId: string): Promise<Result<HealthGoals | null>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('health_goals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return err(mapSupabaseError(error));
  }

  if (!data) {
    return ok(null);
  }

  const parsed = healthGoalsSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Create or update health goals (upsert by user_id)
 */
export async function upsertHealthGoals(
  userId: string,
  input: HealthGoalsUpsert
): Promise<Result<HealthGoals>> {
  const validatedInput = healthGoalsUpsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('health_goals')
    .upsert(
      {
        user_id: userId,
        ...validatedInput.data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = healthGoalsSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}
