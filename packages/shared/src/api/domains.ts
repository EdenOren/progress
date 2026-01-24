import { getSupabase } from '../supabase/client';
import type { Domain } from '../types/domain';
import { domainSchema, domainArraySchema } from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Get all available domains
 */
export async function getDomains(): Promise<Result<Domain[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = domainArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a domain by key (e.g., 'workout')
 */
export async function getDomainByKey(key: string): Promise<Result<Domain>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('key', key)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = domainSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a domain by ID
 */
export async function getDomainById(domainId: string): Promise<Result<Domain>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = domainSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}
