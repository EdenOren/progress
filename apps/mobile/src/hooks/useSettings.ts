import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserSettings,
  updateUserSettings,
  updateModuleSettings,
  type UserSettings,
  type UserSettingsUpdate,
  type WorkoutModuleSettings,
  type DailyLogModuleSettings,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

const QUERY_KEYS = {
  settings: ['settings'] as const,
};

/**
 * Hook to fetch user settings
 */
export function useUserSettings() {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: async (): Promise<UserSettings> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getUserSettings(user.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
  });
}

/**
 * Hook to update user settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (updates: UserSettingsUpdate): Promise<UserSettings> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateUserSettings(user.id, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.settings, data);
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to update workout settings specifically
 */
export function useUpdateWorkoutSettings() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (settings: Partial<WorkoutModuleSettings>): Promise<UserSettings> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateModuleSettings(user.id, 'workout', settings);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.settings, data);
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to update daily log settings specifically
 */
export function useUpdateDailyLogSettings() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (settings: Partial<DailyLogModuleSettings>): Promise<UserSettings> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateModuleSettings(user.id, 'daily_log', settings);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.settings, data);
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
