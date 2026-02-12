import { getSupabase, type Database } from '../supabase/client';
import type { Subject, SubjectInsert, SubjectUpdate, SubjectWithStats } from '../types/domain';
import { subjectSchema, subjectArraySchema, subjectInsertSchema } from '../schemas/domain';
import { type Result, ok, err } from '../types/result';
import { mapSupabaseError, ValidationError } from '../errors/index';

/**
 * Get all active subjects for a user
 */
export async function getSubjects(userId: string): Promise<Result<Subject[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get all subjects for a user (including inactive)
 */
export async function getAllSubjects(userId: string): Promise<Result<Subject[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get subjects by domain
 */
export async function getSubjectsByDomain(
  userId: string,
  domainId: string
): Promise<Result<Subject[]>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('domain_id', domainId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectArraySchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a single subject by ID
 */
export async function getSubjectById(
  userId: string,
  subjectId: string
): Promise<Result<Subject>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('id', subjectId)
    .eq('user_id', userId)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get subjects with entry statistics
 */
export async function getSubjectsWithStats(userId: string): Promise<Result<SubjectWithStats[]>> {
  const supabase = getSupabase();

  // Use RPC or a view for this in production
  // For now, we'll do two queries
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (subjectsError) {
    return err(mapSupabaseError(subjectsError));
  }

  // Get entry counts and last dates
  const { data: entryCounts, error: countsError } = await supabase
    .from('entries')
    .select('subject_id, performed_at')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false });

  if (countsError) {
    return err(mapSupabaseError(countsError));
  }

  // Type for partial entry select
  type EntryStats = { subject_id: string; performed_at: string };
  const typedEntryCounts = (entryCounts ?? []) as EntryStats[];

  // Aggregate stats
  const statsMap = new Map<string, { count: number; lastDate: string | null }>();

  for (const entry of typedEntryCounts) {
    const existing = statsMap.get(entry.subject_id);
    if (existing) {
      existing.count++;
    } else {
      statsMap.set(entry.subject_id, {
        count: 1,
        lastDate: entry.performed_at,
      });
    }
  }

  // Type assertion for subjects array
  type SubjectRow = Database['public']['Tables']['subjects']['Row'];
  const typedSubjects = (subjects ?? []) as SubjectRow[];

  const subjectsWithStats: SubjectWithStats[] = typedSubjects.map((subject) => {
    const stats = statsMap.get(subject.id);
    return {
      ...subject,
      entry_count: stats?.count ?? 0,
      last_entry_date: stats?.lastDate ?? null,
    } as SubjectWithStats;
  });

  return ok(subjectsWithStats);
}

/**
 * Create a new subject
 */
export async function createSubject(input: SubjectInsert): Promise<Result<Subject>> {
  // Validate input
  const validatedInput = subjectInsertSchema.safeParse(input);
  if (!validatedInput.success) {
    return err(new ValidationError(validatedInput.error));
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .insert(validatedInput.data)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Update a subject
 */
export async function updateSubject(
  userId: string,
  subjectId: string,
  updates: SubjectUpdate
): Promise<Result<Subject>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', subjectId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Get a single subject by ordinal number (per-user)
 */
export async function getSubjectByOrdinal(
  userId: string,
  ordinal: number
): Promise<Result<Subject>> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('ordinal', ordinal)
    .eq('is_active', true)
    .single();

  if (error) {
    return err(mapSupabaseError(error));
  }

  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) {
    return err(new ValidationError(parsed.error));
  }

  return ok(parsed.data);
}

/**
 * Soft delete a subject (set is_active to false)
 */
export async function deleteSubject(
  userId: string,
  subjectId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('subjects')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', subjectId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}

/**
 * Restore a soft-deleted subject
 */
export async function restoreSubject(
  userId: string,
  subjectId: string
): Promise<Result<Subject>> {
  return updateSubject(userId, subjectId, { is_active: true });
}

/**
 * Permanently delete a subject and all children (entries, items, sets, feedback, goals).
 * DB foreign keys with ON DELETE CASCADE handle child removal.
 */
export async function hardDeleteSubject(
  userId: string,
  subjectId: string
): Promise<Result<void>> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId)
    .eq('user_id', userId);

  if (error) {
    return err(mapSupabaseError(error));
  }

  return ok(undefined);
}
