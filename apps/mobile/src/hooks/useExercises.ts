import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchExercises,
  getAllExercises,
  getExercisesByMuscleGroup,
  getExerciseById,
  createCustomExercise,
  deleteCustomExercise,
  type ExerciseInsert,
} from '@progress/shared';
import { useSupabaseContext } from '../providers/SupabaseProvider';
import { handleError } from '../utils/errorHandler';

/** Query key factory for exercises */
export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (userId: string) => [...exerciseKeys.all, 'list', userId] as const,
  search: (userId: string, query: string) => [...exerciseKeys.all, 'search', userId, query] as const,
  byMuscleGroup: (userId: string, group: string) => [...exerciseKeys.all, 'muscleGroup', userId, group] as const,
  detail: (exerciseId: string, userId: string) => [...exerciseKeys.all, 'detail', exerciseId, userId] as const,
};

/**
 * Search exercises by name
 */
export function useSearchExercises(query: string) {
  const { user } = useSupabaseContext();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: exerciseKeys.search(userId, query),
    queryFn: async () => {
      const result = await searchExercises(query, userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId && query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get all exercises visible to the user
 */
export function useAllExercises() {
  const { user } = useSupabaseContext();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: exerciseKeys.list(userId),
    queryFn: async () => {
      const result = await getAllExercises(userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Get exercises by muscle group
 */
export function useExercisesByMuscleGroup(muscleGroup: string) {
  const { user } = useSupabaseContext();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: exerciseKeys.byMuscleGroup(userId, muscleGroup),
    queryFn: async () => {
      const result = await getExercisesByMuscleGroup(userId, muscleGroup);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId && !!muscleGroup,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Get single exercise by ID
 */
export function useExercise(exerciseId: string) {
  const { user } = useSupabaseContext();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: exerciseKeys.detail(exerciseId, userId),
    queryFn: async () => {
      const result = await getExerciseById(exerciseId, userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!userId && !!exerciseId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Create a custom exercise
 */
export function useCreateCustomExercise() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: async (input: Omit<ExerciseInsert, 'created_by'>) => {
      const result = await createCustomExercise(input, userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Delete a custom exercise
 */
export function useDeleteCustomExercise() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: async (exerciseId: string) => {
      const result = await deleteCustomExercise(exerciseId, userId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
