import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkoutTemplate,
  addToTemplate,
  addMultipleToTemplate,
  updateTemplateItem,
  removeFromTemplate,
  hardRemoveFromTemplate,
  reorderTemplate,
  getNextTemplatePosition,
  type WorkoutTemplateInsert,
  type WorkoutTemplateUpdate,
  type TemplateSetConfig,
} from '@progress/shared';
import { handleError } from '../utils/errorHandler';

/** Query key factory for templates */
export const templateKeys = {
  all: ['templates'] as const,
  bySubject: (subjectId: string) => [...templateKeys.all, 'subject', subjectId] as const,
  position: (subjectId: string) => [...templateKeys.all, 'position', subjectId] as const,
};

/**
 * Get workout template for a subject
 */
export function useWorkoutTemplate(subjectId: string) {
  return useQuery({
    queryKey: templateKeys.bySubject(subjectId),
    queryFn: async () => {
      const result = await getWorkoutTemplate(subjectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get next available position for template item
 */
export function useNextTemplatePosition(subjectId: string) {
  return useQuery({
    queryKey: templateKeys.position(subjectId),
    queryFn: async () => {
      const result = await getNextTemplatePosition(subjectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!subjectId,
  });
}

/**
 * Add exercise to workout template
 */
export function useAddToTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WorkoutTemplateInsert) => {
      const result = await addToTemplate(input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(variables.subject_id) });
      queryClient.invalidateQueries({ queryKey: templateKeys.position(variables.subject_id) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Add exercise to template with auto-position
 */
export function useAddExerciseToTemplate(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { exerciseId: string; defaultSets?: TemplateSetConfig[] }) => {
      // Get next position
      const posResult = await getNextTemplatePosition(subjectId);
      if (!posResult.success) {
        throw posResult.error;
      }

      const result = await addToTemplate({
        subject_id: subjectId,
        exercise_id: input.exerciseId,
        position: posResult.data,
        default_sets: input.defaultSets,
      });

      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(subjectId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.position(subjectId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Add multiple exercises to template in one call (bulk add)
 */
export function useBulkAddExercisesToTemplate(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: Array<{ exerciseId: string; defaultSets?: TemplateSetConfig[] }>) => {
      // Get next position
      const posResult = await getNextTemplatePosition(subjectId);
      if (!posResult.success) {
        throw posResult.error;
      }

      // Build all inserts with sequential positions
      const inserts: WorkoutTemplateInsert[] = inputs.map((input, index) => ({
        subject_id: subjectId,
        exercise_id: input.exerciseId,
        position: posResult.data + index,
        default_sets: input.defaultSets,
      }));

      const result = await addMultipleToTemplate(inserts);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(subjectId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.position(subjectId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Update template item
 */
export function useUpdateTemplateItem(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateItemId, updates }: { templateItemId: string; updates: WorkoutTemplateUpdate }) => {
      const result = await updateTemplateItem(templateItemId, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(subjectId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Remove exercise from template (soft delete)
 */
export function useRemoveFromTemplate(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateItemId: string) => {
      const result = await removeFromTemplate(templateItemId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(subjectId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hard delete exercise from template
 */
export function useHardRemoveFromTemplate(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateItemId: string) => {
      const result = await hardRemoveFromTemplate(templateItemId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(subjectId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.position(subjectId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Reorder template items
 */
export function useReorderTemplate(subjectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const result = await reorderTemplate(subjectId, orderedIds);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.bySubject(subjectId) });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
