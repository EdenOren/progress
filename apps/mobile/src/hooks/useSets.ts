import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSet,
  updateSet,
  deleteSet,
  type ItemSet,
  type ItemSetInsert,
  type ItemSetUpdate,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

/**
 * Hook to create a new set
 */
export function useCreateSet() {
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (input: Omit<ItemSetInsert, 'user_id'>): Promise<ItemSet> => {
      if (!user) throw new Error('Not authenticated');

      const result = await createSet({
        ...input,
        user_id: user.id,
      });

      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to update a set (used for auto-save on blur)
 */
export function useUpdateSet(entryId: string) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      setId,
      updates,
    }: {
      setId: string;
      updates: ItemSetUpdate;
    }): Promise<ItemSet> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateSet(user.id, setId, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate the entry to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to delete a set
 */
export function useDeleteSet(entryId: string) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (setId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteSet(user.id, setId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
