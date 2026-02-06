import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserSettings,
  updateUserSettings,
  toggleModule,
  updateModuleSettings,
  type UserSettings,
  type UserSettingsUpdate,
  type ModuleKey,
  type WorkoutModuleSettings,
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
 * Hook to toggle a module on or off
 */
export function useToggleModule() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      moduleKey,
      enabled,
    }: {
      moduleKey: ModuleKey;
      enabled: boolean;
    }): Promise<UserSettings> => {
      if (!user) throw new Error('Not authenticated');

      const result = await toggleModule(user.id, moduleKey, enabled);
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
 * Hook to update settings for a specific module
 */
export function useUpdateModuleSettings() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      moduleKey,
      settings,
    }: {
      moduleKey: ModuleKey;
      settings: Partial<WorkoutModuleSettings>;
    }): Promise<UserSettings> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateModuleSettings(user.id, moduleKey, settings);
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
 * Hook to update workout module settings specifically
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
