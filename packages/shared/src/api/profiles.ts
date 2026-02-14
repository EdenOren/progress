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
  const now = new Date().toISOString();

  // Try update first
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ ...validatedUpdates.data, updated_at: now })
    .eq('id', userId)
    .select()
    .single();

  // If update succeeded, use that data
  let data = updateData;
  let error = updateError;

  // If no row found (PGRST116), insert a new profile row
  if (updateError && updateError.code === 'PGRST116') {
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, display_name: 'User', ...validatedUpdates.data, updated_at: now })
      .select()
      .single();
    data = insertData;
    error = insertError;
  }

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}
