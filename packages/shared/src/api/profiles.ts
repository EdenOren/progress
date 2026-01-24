import { getSupabase } from '../supabase/client';
import type { Profile, ProfileUpdate } from '../types/domain';
import { profileSchema, profileUpdateSchema } from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Get the current user's profile
 */
export async function getProfile(userId: string): Promise<Result<Profile>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Result<Profile>> {
  const validatedUpdates = profileUpdateSchema.safeParse(updates);
  if (!validatedUpdates.success) {
    return err(new ValidationError(validatedUpdates.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...validatedUpdates.data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}
