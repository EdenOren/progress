import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEntriesBySubject,
  getEntryWithItems,
  getLastEntryForSubject,
  createEntry,
  createEntryWithTemplate,
  updateEntry,
  completeEntry,
  deleteEntry,
  type Entry,
  type EntryInsert,
  type EntryUpdate,
  type EntryWithItems,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

const QUERY_KEYS = {
  entries: (subjectId: string) => ['entries', subjectId] as const,
  entry: (entryId: string) => ['entries', 'detail', entryId] as const,
  lastEntry: (subjectId: string) => ['entries', 'last', subjectId] as const,
};

/**
 * Hook to fetch entries for a subject
 */
export function useEntries(subjectId: string) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.entries(subjectId),
    queryFn: async (): Promise<Entry[]> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getEntriesBySubject(user.id, subjectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && !!subjectId,
  });
}

/**
 * Hook to fetch a single entry with all items, sets, and feedback
 */
export function useEntryWithItems(entryId: string) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.entry(entryId),
    queryFn: async (): Promise<EntryWithItems> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getEntryWithItems(user.id, entryId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && !!entryId,
  });
}

/**
 * Hook to fetch the last entry for a subject (for comparison)
 */
export function useLastEntry(subjectId: string, beforeDate?: string) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.lastEntry(subjectId), beforeDate],
    queryFn: async (): Promise<EntryWithItems | null> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getLastEntryForSubject(user.id, subjectId, beforeDate);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && !!subjectId,
  });
}

/**
 * Hook to create a new entry
 */
export function useCreateEntry() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (input: Omit<EntryInsert, 'user_id'>): Promise<Entry> => {
      if (!user) throw new Error('Not authenticated');

      const result = await createEntry({
        ...input,
        user_id: user.id,
      });

      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate entries for this subject
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries(data.subject_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lastEntry(data.subject_id) });
      // Also invalidate subjects stats
      queryClient.invalidateQueries({ queryKey: ['subjects', 'withStats'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to update an entry
 */
export function useUpdateEntry() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      entryId,
      updates,
    }: {
      entryId: string;
      updates: EntryUpdate;
    }): Promise<Entry> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateEntry(user.id, entryId, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entry(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries(data.subject_id) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to mark an entry as completed
 */
export function useCompleteEntry() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (entryId: string): Promise<Entry> => {
      if (!user) throw new Error('Not authenticated');

      const result = await completeEntry(user.id, entryId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entry(data.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries(data.subject_id) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to delete an entry
 */
export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      entryId,
      subjectId: _subjectId,
    }: {
      entryId: string;
      subjectId: string;
    }): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteEntry(user.id, entryId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: (_, { entryId, subjectId }) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.entry(entryId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries(subjectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lastEntry(subjectId) });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'withStats'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
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
 * Hook to create a new entry with template items
 */
export function useCreateEntryWithTemplate() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      input,
      templateItems,
    }: {
      input: Omit<EntryInsert, 'user_id'>;
      templateItems: TemplateItemForEntry[];
    }): Promise<Entry> => {
      if (!user) throw new Error('Not authenticated');

      const result = await createEntryWithTemplate(
        { ...input, user_id: user.id },
        templateItems
      );

      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries(data.subject_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lastEntry(data.subject_id) });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'withStats'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
