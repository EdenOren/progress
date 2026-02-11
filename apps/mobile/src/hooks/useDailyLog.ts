import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDailyLogEntries,
  getDailyLogEntryByDate,
  upsertDailyLogEntry,
  deleteDailyLogEntry,
  type DailyLogEntry,
  type DailyLogEntryInsert,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

const QUERY_KEYS = {
  entries: ['dailyLog', 'entries'] as const,
  entryByDate: (date: string) => ['dailyLog', 'date', date] as const,
};

/**
 * Hook to fetch daily log entries
 */
export function useDailyLogEntries(limit: number = 30) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.entries, limit],
    queryFn: async (): Promise<DailyLogEntry[]> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getDailyLogEntries(user.id, limit);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
  });
}

/**
 * Hook to fetch a daily log entry by date
 */
export function useDailyLogEntryByDate(date: string | null) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: date ? QUERY_KEYS.entryByDate(date) : ['disabled'],
    queryFn: async (): Promise<DailyLogEntry | null> => {
      if (!user || !date) throw new Error('Not authenticated or no date');

      const result = await getDailyLogEntryByDate(user.id, date);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && !!date,
  });
}

/**
 * Hook to create or update a daily log entry (upsert)
 */
export function useUpsertDailyLogEntry() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (input: DailyLogEntryInsert): Promise<DailyLogEntry> => {
      if (!user) throw new Error('Not authenticated');

      const result = await upsertDailyLogEntry(user.id, input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Invalidate entries list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries });
      // Invalidate specific date entry
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entryByDate(data.logged_date) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to delete a daily log entry
 */
export function useDeleteDailyLogEntry() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      entryId,
    }: {
      entryId: string;
      loggedDate: string;
    }): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteDailyLogEntry(user.id, entryId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: (_, { loggedDate: date }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entryByDate(date) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
