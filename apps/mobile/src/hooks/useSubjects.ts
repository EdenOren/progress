import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubjects,
  getSubjectsWithStats,
  getSubjectById,
  getSubjectByOrdinal,
  createSubject,
  updateSubject,
  deleteSubject,
  hardDeleteSubject,
  type Subject,
  type SubjectInsert,
  type SubjectUpdate,
  type SubjectWithStats,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';

const QUERY_KEYS = {
  subjects: ['subjects'] as const,
  subjectsWithStats: ['subjects', 'withStats'] as const,
  subject: (id: string) => ['subjects', id] as const,
  subjectByOrdinal: (ordinal: number) => ['subjects', 'byOrdinal', ordinal] as const,
};

/**
 * Hook to fetch all active subjects
 */
export function useSubjects() {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.subjects,
    queryFn: async (): Promise<Subject[]> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getSubjects(user.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
  });
}

/**
 * Hook to fetch subjects with entry statistics
 */
export function useSubjectsWithStats() {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.subjectsWithStats,
    queryFn: async (): Promise<SubjectWithStats[]> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getSubjectsWithStats(user.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user,
  });
}

/**
 * Hook to fetch a single subject by ID
 */
export function useSubject(subjectId: string) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.subject(subjectId),
    queryFn: async (): Promise<Subject> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getSubjectById(user.id, subjectId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && !!subjectId,
  });
}

/**
 * Hook to fetch a single subject by ordinal number
 */
export function useSubjectByOrdinal(ordinal: number) {
  const { user } = useSupabaseContext();

  return useQuery({
    queryKey: QUERY_KEYS.subjectByOrdinal(ordinal),
    queryFn: async (): Promise<Subject> => {
      if (!user) throw new Error('Not authenticated');

      const result = await getSubjectByOrdinal(user.id, ordinal);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!user && ordinal > 0,
  });
}

/**
 * Hook to create a new subject
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (input: Omit<SubjectInsert, 'user_id'>): Promise<Subject> => {
      if (!user) throw new Error('Not authenticated');

      const result = await createSubject({
        ...input,
        user_id: user.id,
      });

      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate subjects queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjectsWithStats });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'byOrdinal'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to update a subject
 */
export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async ({
      subjectId,
      updates,
    }: {
      subjectId: string;
      updates: SubjectUpdate;
    }): Promise<Subject> => {
      if (!user) throw new Error('Not authenticated');

      const result = await updateSubject(user.id, subjectId, updates);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(QUERY_KEYS.subject(data.id), data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjectsWithStats });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'byOrdinal'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to delete (soft delete) a subject
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (subjectId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const result = await deleteSubject(user.id, subjectId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: (_, subjectId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.subject(subjectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjectsWithStats });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'byOrdinal'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}

/**
 * Hook to permanently delete a subject and all its children
 */
export function useHardDeleteSubject() {
  const queryClient = useQueryClient();
  const { user } = useSupabaseContext();

  return useMutation({
    mutationFn: async (subjectId: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');

      const result = await hardDeleteSubject(user.id, subjectId);
      if (!result.success) {
        throw result.error;
      }
    },
    onSuccess: (_, subjectId) => {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.subject(subjectId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjects });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subjectsWithStats });
      queryClient.invalidateQueries({ queryKey: ['subjects', 'byOrdinal'] });
    },
    onError: (error) => {
      handleError(error);
    },
  });
}
