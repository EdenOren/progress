import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile, type Profile, type ProfileUpdate } from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

const QUERY_KEYS = {
  profile: ['profile'] as const,
};

export function useProfile() {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async (): Promise<Profile> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getProfile(user.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (updates: ProfileUpdate): Promise<Profile> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateProfile(user.id, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.profile, data);
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
