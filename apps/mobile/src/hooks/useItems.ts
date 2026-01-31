import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateItem, deleteItem, type Item, type ItemUpdate } from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

/**
 * Hook to update an item (e.g., updating notes)
 */
export function useUpdateItem(entryId: string) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: ItemUpdate;
    }): Promise<Item> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateItem(user.id, itemId, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to delete an item (exercise) from an entry
 */
export function useDeleteItem(entryId: string) {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (itemId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteItem(user.id, itemId);
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
