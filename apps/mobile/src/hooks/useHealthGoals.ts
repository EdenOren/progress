import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHealthGoals,
  upsertHealthGoals,
  type HealthGoals,
  type HealthGoalsUpsert,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

const QUERY_KEYS = {
  healthGoals: ['healthGoals'] as const,
};

export { QUERY_KEYS as healthGoalsKeys };

export function useHealthGoals() {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.healthGoals,
    queryFn: async (): Promise<HealthGoals | null> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getHealthGoals(user.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
  });
}

export function useUpsertHealthGoals() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (input: HealthGoalsUpsert): Promise<HealthGoals> => {
      if (!user) throw new Error('Not authenticated');

      const result = await upsertHealthGoals(user.id, input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.healthGoals, data);
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
