import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, Pressable, Modal } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRelativeDate } from '@progress/shared';
import { EmptyState, Button } from '../../src/components';
import {
  useSubjectsWithStats,
  useHardDeleteSubject,
  useRecentEntries,
  useWorkoutTemplate,
  useCreateEntryWithTemplate,
  useDeleteEntry,
} from '../../src/hooks';
import { showSuccessToast } from '../../src/utils';
import { CreateSubjectModal } from '../../src/components/CreateSubjectModal';
import type { SubjectWithStats, Entry } from '@progress/shared';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

interface WorkoutCardProps {
  subject: SubjectWithStats;
  onEdit: () => void;
  onDelete: () => void;
}

function WorkoutCard({ subject, onEdit, onDelete }: WorkoutCardProps): React.ReactElement {
  const theme = useTheme();
  const { data: template } = useWorkoutTemplate(subject.id);
  const createEntry = useCreateEntryWithTemplate();
  const exerciseCount = template?.length ?? 0;

  const handleStart = useCallback(async () => {
    if (!template || createEntry.isPending) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0] as string;
    const templateItems = template.map(t => ({
      exercise_id: t.exercise_id,
      name: t.exercise.name,
      tracking_type: t.exercise.tracking_type,
      default_sets: t.default_sets,
    }));

    createEntry.mutate(
      {
        input: {
          subject_id: subject.id,
          performed_at: today,
          started_at: now.toISOString(),
        },
        templateItems,
      },
      {
        onSuccess: (entry) => {
          router.push({
            pathname: '/entry/[id]',
            params: { id: entry.id },
          });
        },
      }
    );
  }, [template, createEntry, subject.id]);

  return (
    <XStack
      backgroundColor="$backgroundHover"
      borderRadius="$3"
      padding="$3"
      alignItems="center"
      gap="$3"
    >
      {/* Workout info */}
      <YStack flex={1} gap="$0.5">
        <Text fontSize={16} fontWeight="600" color="$color">
          {subject.name}
        </Text>
        <Text fontSize={12} color="$textMuted">
          {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
        </Text>
      </YStack>

      {/* Start button */}
      <Button
        variant="primary"
        size="small"
        onPress={handleStart}
        disabled={createEntry.isPending || exerciseCount === 0}
        loading={createEntry.isPending}
      >
        Start
      </Button>

      {/* Edit icon */}
      <Pressable
        onPress={onEdit}
        style={{ cursor: 'pointer', userSelect: 'none' } as never}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Stack
          width={32}
          height={32}
          borderRadius={16}
          backgroundColor="rgba(59, 130, 246, 0.1)"
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={16}
            color={theme.secondary?.val ?? '#3B82F6'}
          />
        </Stack>
      </Pressable>

      {/* Delete icon */}
      <Pressable
        onPress={onDelete}
        style={{ cursor: 'pointer', userSelect: 'none' } as never}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Stack
          width={32}
          height={32}
          borderRadius={16}
          backgroundColor="rgba(239, 68, 68, 0.1)"
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color={theme.error?.val ?? '#EF4444'}
          />
        </Stack>
      </Pressable>
    </XStack>
  );
}

interface SessionCardProps {
  entry: Entry;
  subjectName: string;
  onPress: () => void;
  onDelete?: () => void;
}

function SessionCard({ entry, subjectName, onPress, onDelete }: SessionCardProps): React.ReactElement {
  const theme = useTheme();

  return (
    <XStack
      backgroundColor="$backgroundHover"
      padding="$3"
      borderRadius="$3"
      alignItems="center"
      gap="$3"
    >
      <Pressable
        onPress={onPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' } as never}
      >
        <Stack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor="$blue5"
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name="history"
            size={20}
            color="#3B82F6"
          />
        </Stack>
        <YStack flex={1}>
          <Text fontSize={15} fontWeight="600" color="$color">
            {subjectName}
          </Text>
          <XStack gap="$2" alignItems="center">
            <Text fontSize={13} color="$textMuted">
              {formatRelativeDate(entry.performed_at)}
            </Text>
            {entry.duration_seconds && (
              <>
                <Text fontSize={13} color="$textMuted">·</Text>
                <Text fontSize={13} color="$textMuted">
                  {formatDuration(entry.duration_seconds)}
                </Text>
              </>
            )}
          </XStack>
        </YStack>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#666"
        />
      </Pressable>

      {onDelete && (
        <Pressable
          onPress={onDelete}
          style={{ cursor: 'pointer', userSelect: 'none' } as never}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Stack
            width={32}
            height={32}
            borderRadius={16}
            backgroundColor="rgba(239, 68, 68, 0.1)"
            alignItems="center"
            justifyContent="center"
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color={theme.error?.val ?? '#EF4444'}
            />
          </Stack>
        </Pressable>
      )}
    </XStack>
  );
}

export default function WorkoutsScreen(): React.ReactElement {
  const theme = useTheme();
  const { data: subjects, isLoading: subjectsLoading, refetch, isRefetching } = useSubjectsWithStats();
  const { data: recentEntries, isLoading: entriesLoading } = useRecentEntries(5);
  const hardDelete = useHardDeleteSubject();
  const deleteEntry = useDeleteEntry();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecentSessions, setShowRecentSessions] = useState(false);

  // Map subject IDs to names for recent sessions
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects?.forEach(s => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  const handleEditSubject = useCallback((subject: SubjectWithStats): void => {
    router.push({
      pathname: '/subject/[id]',
      params: { id: subject.id },
    });
  }, []);

  const handleDeleteSubject = useCallback((subject: SubjectWithStats): void => {
    if (hardDelete.isPending) return;
    hardDelete.mutate(subject.id, {
      onSuccess: () => showSuccessToast('Workout deleted'),
    });
  }, [hardDelete]);

  const handleViewSession = useCallback((entry: Entry): void => {
    router.push({
      pathname: '/entry/[id]',
      params: { id: entry.id },
    });
  }, []);

  const handleDeleteSession = useCallback((entry: Entry): void => {
    if (deleteEntry.isPending) return;
    deleteEntry.mutate(
      { entryId: entry.id, subjectId: entry.subject_id },
      {
        onSuccess: () => showSuccessToast('Session deleted'),
      }
    );
  }, [deleteEntry]);

  const isLoading = subjectsLoading || entriesLoading;

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <ActivityIndicator size="large" color={theme.primary?.val ?? '#8B5CF6'} />
      </YStack>
    );
  }

  const hasWorkouts = (subjects?.length ?? 0) > 0;
  const hasRecentSessions = (recentEntries?.length ?? 0) > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
      <YStack flex={1}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: hasRecentSessions ? 70 : 20 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {!hasWorkouts ? (
            <EmptyState
              title="No workouts yet"
              message="Create your first workout routine to get started"
              actionLabel="Create Workout"
              onAction={() => setShowCreateModal(true)}
            />
          ) : (
            <YStack padding="$4" gap="$3">
              {/* Header with title and add button */}
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
                  Your Workouts
                </Text>
                <Pressable
                  onPress={() => setShowCreateModal(true)}
                  style={{ cursor: 'pointer', userSelect: 'none' } as never}
                >
                  <XStack alignItems="center" gap="$1">
                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color={theme.primary?.val ?? '#8B5CF6'}
                    />
                    <Text fontSize={14} fontWeight="600" color="$primary">
                      New
                    </Text>
                  </XStack>
                </Pressable>
              </XStack>

              {/* Workout cards */}
              <YStack gap="$3">
                {subjects?.map(subject => (
                  <WorkoutCard
                    key={subject.id}
                    subject={subject}
                    onEdit={() => handleEditSubject(subject)}
                    onDelete={() => handleDeleteSubject(subject)}
                  />
                ))}
              </YStack>
            </YStack>
          )}
        </ScrollView>

        {/* Sticky Recent Sessions Bar */}
        {hasRecentSessions && (
          <Pressable
            onPress={() => setShowRecentSessions(true)}
            style={{ cursor: 'pointer', userSelect: 'none' } as never}
          >
            <XStack
              backgroundColor="$backgroundHover"
              paddingHorizontal="$4"
              paddingVertical="$3"
              borderTopWidth={1}
              borderTopColor="$borderColor"
              alignItems="center"
              justifyContent="space-between"
            >
              <XStack alignItems="center" gap="$3">
                <Stack
                  width={32}
                  height={32}
                  borderRadius={16}
                  backgroundColor="$blue5"
                  alignItems="center"
                  justifyContent="center"
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={18}
                    color="#3B82F6"
                  />
                </Stack>
                <Text fontSize={14} fontWeight="600" color="$color">
                  Recent Sessions
                </Text>
                <Stack
                  backgroundColor="$blue5"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize={12} fontWeight="600" color="$secondary">
                    {recentEntries?.length}
                  </Text>
                </Stack>
              </XStack>
              <MaterialCommunityIcons
                name="chevron-up"
                size={20}
                color={theme.textMuted?.val ?? '#666'}
              />
            </XStack>
          </Pressable>
        )}
      </YStack>

      {/* Recent Sessions Modal */}
      <Modal
        visible={showRecentSessions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecentSessions(false)}
      >
        <YStack flex={1} backgroundColor="$background">
          {/* Header */}
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Stack width={60} />
            <Text fontWeight="700" fontSize={17}>
              Recent Sessions
            </Text>
            <Pressable
              onPress={() => setShowRecentSessions(false)}
              style={{ cursor: 'pointer', userSelect: 'none', width: 60, alignItems: 'flex-end' } as never}
            >
              <Text fontSize={16} fontWeight="600" color="$primary">
                Done
              </Text>
            </Pressable>
          </XStack>

          {/* Sessions List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            <YStack gap="$2">
              {recentEntries?.map(entry => (
                <SessionCard
                  key={entry.id}
                  entry={entry}
                  subjectName={subjectMap.get(entry.subject_id) ?? 'Workout'}
                  onPress={() => {
                    setShowRecentSessions(false);
                    handleViewSession(entry);
                  }}
                  onDelete={() => handleDeleteSession(entry)}
                />
              ))}
            </YStack>
          </ScrollView>
        </YStack>
      </Modal>

      <CreateSubjectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </SafeAreaView>
  );
}
