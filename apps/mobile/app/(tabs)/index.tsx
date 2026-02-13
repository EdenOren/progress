import React, { useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, Pressable, Modal, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColorScheme } from '../../src/hooks/useAppColorScheme';
import { formatRelativeDate, getTodayISO, DEFAULT_DAILY_LOG_SETTINGS, type DailyLogEntry } from '@progress/shared';
import { EmptyState, DailyLogEntryCard, LogDailyLogModal } from '../../src/components';
import {
  useSubjectsWithStats,
  useHardDeleteSubject,
  useRecentEntries,
  useInProgressEntry,
  useWorkoutTemplate,
  useCreateEntryWithTemplate,
  useCompleteEntry,
  useDeleteEntry,
  useDailyLogEntries,
  useDailyLogEntryByDate,
  useUserSettings,
} from '../../src/hooks';
import { showSuccessToast, showErrorToast } from '../../src/utils';
import { CreateSubjectModal } from '../../src/components/CreateSubjectModal';
import type { SubjectWithStats, Entry } from '@progress/shared';

// Daily Log Module
function DailyLogModule(): React.ReactElement {
  const theme = useTheme();
  const { data: entries, isLoading, refetch, isRefetching } = useDailyLogEntries(30);
  const { data: settings } = useUserSettings();
  const today = getTodayISO();
  const { data: todayEntry } = useDailyLogEntryByDate(today);

  // Get weight unit from settings
  const weightUnit = settings?.module_settings.daily_log?.weight_unit ?? DEFAULT_DAILY_LOG_SETTINGS.weight_unit;

  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DailyLogEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleLogToday = useCallback(() => {
    setSelectedEntry(todayEntry ?? null);
    setSelectedDate(today);
    setShowLogModal(true);
  }, [todayEntry, today]);

  const handleAddNew = useCallback(() => {
    setSelectedEntry(null);
    setSelectedDate(today);
    setShowLogModal(true);
  }, [today]);

  const handleEditEntry = useCallback((entry: DailyLogEntry) => {
    setSelectedEntry(entry);
    setSelectedDate(entry.logged_date);
    setShowLogModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowLogModal(false);
    setSelectedEntry(null);
    setSelectedDate(null);
  }, []);

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <ActivityIndicator size="large" color={theme.primary?.val ?? '#8B5CF6'} />
      </YStack>
    );
  }

  const hasEntries = (entries?.length ?? 0) > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
      <YStack flex={1}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.primary?.val}
              colors={[theme.primary?.val ?? '#8B5CF6']}
              progressBackgroundColor={theme.backgroundHover?.val}
            />
          }
        >
          {!hasEntries ? (
            <EmptyState
              title="No entries yet"
              message="Start tracking your sleep, weight, and body metrics"
              actionLabel="Log Today"
              onAction={handleLogToday}
            />
          ) : (
            <YStack padding="$4" gap="$3">
              {/* Header */}
              <XStack alignItems="center" justifyContent="space-between">
                <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
                  Recent Entries
                </Text>
                <Pressable
                  onPress={handleAddNew}
                  style={{ cursor: 'pointer', userSelect: 'none' } as never}
                >
                  <XStack alignItems="center" gap="$1">
                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color={theme.primary?.val ?? '#8B5CF6'}
                    />
                    <Text fontSize={14} fontWeight="600" color="$primary">
                      Add
                    </Text>
                  </XStack>
                </Pressable>
              </XStack>

              {/* Entry cards */}
              <YStack gap="$3">
                {entries?.map(entry => (
                  <DailyLogEntryCard
                    key={entry.id}
                    entry={entry}
                    onPress={() => handleEditEntry(entry)}
                    weightUnit={weightUnit}
                  />
                ))}
              </YStack>
            </YStack>
          )}
        </ScrollView>

      </YStack>

      <LogDailyLogModal
        visible={showLogModal}
        onClose={handleCloseModal}
        date={selectedDate ?? undefined}
        existingEntry={selectedEntry}
      />
    </SafeAreaView>
  );
}

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
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onStart: () => void;
  isStarting: boolean;
  exerciseCount: number;
  hasInProgressEntry?: boolean;
}

function WorkoutCard({
  subject,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
  onStart,
  isStarting,
  exerciseCount,
  hasInProgressEntry = false,
}: WorkoutCardProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{ cursor: 'pointer', userSelect: 'none' } as never}
    >
      <XStack
        backgroundColor={isSelected ? 'rgba(239, 68, 68, 0.1)' : '$backgroundHover'}
        borderRadius="$3"
        padding="$3"
        alignItems="center"
        gap="$3"
        borderWidth={isSelected ? 2 : 0}
        borderColor="$error"
        borderLeftWidth={hasInProgressEntry && !isSelected ? 3 : (isSelected ? 2 : 0)}
        borderLeftColor={hasInProgressEntry && !isSelected ? '$primary' : '$error'}
      >
        {/* Selection checkbox or workout icon */}
        {isSelectionMode ? (
          <Stack
            width={32}
            height={32}
            borderRadius={16}
            backgroundColor={isSelected ? '$error' : 'transparent'}
            borderWidth={isSelected ? 0 : 2}
            borderColor="$textMuted"
            alignItems="center"
            justifyContent="center"
          >
            {isSelected && (
              <MaterialCommunityIcons
                name="check"
                size={18}
                color="white"
              />
            )}
          </Stack>
        ) : (
          <Stack
            width={32}
            height={32}
            borderRadius={16}
            backgroundColor="$purple5"
            alignItems="center"
            justifyContent="center"
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={16}
              color={theme.primary?.val ?? '#8B5CF6'}
            />
          </Stack>
        )}

        {/* Workout info */}
        <YStack flex={1} gap="$0.5">
          <Text fontSize={16} fontWeight="600" color="$color">
            {subject.name}
          </Text>
          <Text fontSize={12} color="$textMuted">
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
            {hasInProgressEntry && ' · In Progress'}
          </Text>
        </YStack>

        {/* Start/Continue button - only show when not in selection mode */}
        {!isSelectionMode && (
          <Stack
            backgroundColor="$primary"
            paddingHorizontal={16}
            paddingVertical={8}
            borderRadius={8}
            opacity={isStarting ? 0.7 : 1}
            pressStyle={{ opacity: 0.8 }}
            onPress={onStart}
            disabled={isStarting || (!hasInProgressEntry && exerciseCount === 0)}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text color="white" fontSize={14} fontWeight="600">
                {hasInProgressEntry ? 'Continue' : 'Start'}
              </Text>
            )}
          </Stack>
        )}
      </XStack>
    </Pressable>
  );
}

// Wrapper component that fetches template and handles start
interface WorkoutCardWithTemplateProps {
  subject: SubjectWithStats;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  startingSubjectId: string | null;
  setStartingSubjectId: (id: string | null) => void;
  inProgressEntry: Entry | null;
  onCompleteEntry: (entryId: string) => Promise<void>;
}

function WorkoutCardWithTemplate({
  subject,
  isSelectionMode,
  isSelected,
  onPress,
  onLongPress,
  startingSubjectId,
  setStartingSubjectId,
  inProgressEntry,
  onCompleteEntry,
}: WorkoutCardWithTemplateProps): React.ReactElement {
  const { data: template } = useWorkoutTemplate(subject.id);
  const createEntry = useCreateEntryWithTemplate();
  const exerciseCount = template?.length ?? 0;
  const isStarting = startingSubjectId === subject.id && createEntry.isPending;

  // Check if this subject has the in-progress entry
  const hasInProgressEntry = inProgressEntry?.subject_id === subject.id;

  const handleStart = useCallback(async () => {
    // If this subject already has an in-progress entry, continue it
    if (hasInProgressEntry && inProgressEntry) {
      router.push({
        pathname: '/subject/[id]/entry/[entryId]',
        params: { id: String(subject.ordinal), entryId: String(inProgressEntry.ordinal) },
      });
      return;
    }

    if (!template || createEntry.isPending || exerciseCount === 0) return;

    setStartingSubjectId(subject.id);

    // Auto-complete any existing in-progress entry from another workout
    if (inProgressEntry && inProgressEntry.subject_id !== subject.id) {
      try {
        await onCompleteEntry(inProgressEntry.id);
      } catch {
        // Continue even if completion fails
      }
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0] as string;
    const templateItems = template.map(t => ({
      exercise_id: t.exercise_id,
      name: t.exercise.name,
      tracking_type: t.exercise.tracking_type,
      default_sets: t.default_sets,
    }));

    try {
      const entry = await createEntry.mutateAsync({
        input: {
          subject_id: subject.id,
          performed_at: today,
          started_at: now.toISOString(),
        },
        templateItems,
      });

      router.push({
        pathname: '/subject/[id]/entry/[entryId]',
        params: { id: String(subject.ordinal), entryId: String(entry.ordinal) },
      });
    } catch {
      // Error shown by mutation's onError handler
    } finally {
      setStartingSubjectId(null);
    }
  }, [template, createEntry, subject.id, subject.ordinal, exerciseCount, setStartingSubjectId, hasInProgressEntry, inProgressEntry, onCompleteEntry]);

  return (
    <WorkoutCard
      subject={subject}
      isSelectionMode={isSelectionMode}
      isSelected={isSelected}
      onPress={onPress}
      onLongPress={onLongPress}
      onStart={handleStart}
      isStarting={isStarting}
      exerciseCount={exerciseCount}
      hasInProgressEntry={hasInProgressEntry}
    />
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
      borderLeftWidth={entry.is_completed ? 0 : 3}
      borderLeftColor="$primary"
    >
      <Pressable
        onPress={onPress}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' } as never}
      >
        <Stack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={entry.is_completed ? '$green5' : '$purple5'}
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name={entry.is_completed ? 'check' : 'play'}
            size={20}
            color={entry.is_completed ? '#10B981' : (theme.primary?.val ?? '#8B5CF6')}
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
            {!entry.is_completed && (
              <>
                <Text fontSize={13} color="$textMuted">·</Text>
                <Text fontSize={13} fontWeight="500" color="$primary">
                  In Progress
                </Text>
              </>
            )}
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

function WorkoutModule(): React.ReactElement {
  const theme = useTheme();
  const { data: subjects, isLoading: subjectsLoading, refetch, isRefetching } = useSubjectsWithStats();
  const { data: recentEntries, isLoading: entriesLoading } = useRecentEntries(5);
  const inProgressEntry = useInProgressEntry();
  const hardDelete = useHardDeleteSubject();
  const deleteEntry = useDeleteEntry();
  const completeEntry = useCompleteEntry();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecentSessions, setShowRecentSessions] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [startingSubjectId, setStartingSubjectId] = useState<string | null>(null);

  // Get workout name for in-progress entry
  const inProgressWorkoutName = useMemo(() => {
    if (!inProgressEntry || !subjects) return null;
    const subject = subjects.find(s => s.id === inProgressEntry.subject_id);
    return subject?.name ?? 'Workout';
  }, [inProgressEntry, subjects]);

  // Handle completing an entry
  const handleCompleteEntry = useCallback(async (entryId: string) => {
    await completeEntry.mutateAsync(entryId);
  }, [completeEntry]);

  // Navigate to in-progress entry
  const handleContinueSession = useCallback(() => {
    if (inProgressEntry) {
      const subjectOrdinal = subjects?.find(s => s.id === inProgressEntry.subject_id)?.ordinal;
      if (subjectOrdinal) {
        router.push({
          pathname: '/subject/[id]/entry/[entryId]',
          params: { id: String(subjectOrdinal), entryId: String(inProgressEntry.ordinal) },
        });
      } else {
        showErrorToast('Unable to open session. Please try again.');
      }
    }
  }, [inProgressEntry, subjects]);

  // Map subject IDs to names for recent sessions
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects?.forEach(s => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  // Toggle selection of a workout
  const toggleSelection = useCallback((id: string) => {
    // Light haptic on selection toggle (mobile only)
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Exit selection mode if nothing selected
        if (next.size === 0) {
          setIsSelectionMode(false);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Start selection mode with initial item
  const startSelectionMode = useCallback((id: string) => {
    // Haptic feedback on long press (mobile only)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  // Handle workout card press
  const handleWorkoutPress = useCallback((subject: SubjectWithStats) => {
    if (isSelectionMode) {
      toggleSelection(subject.id);
    } else {
      // Navigate to edit using ordinal
      router.push({
        pathname: '/subject/[id]',
        params: { id: String(subject.ordinal) },
      });
    }
  }, [isSelectionMode, toggleSelection]);

  // Handle workout card long press
  const handleWorkoutLongPress = useCallback((subject: SubjectWithStats) => {
    if (!isSelectionMode) {
      startSelectionMode(subject.id);
    }
  }, [isSelectionMode, startSelectionMode]);

  // Delete selected workouts
  const handleDeleteSelected = useCallback(() => {
    if (hardDelete.isPending || selectedIds.size === 0) return;

    const idsToDelete = Array.from(selectedIds);
    let deletedCount = 0;

    idsToDelete.forEach(id => {
      hardDelete.mutate(id, {
        onSuccess: () => {
          deletedCount++;
          if (deletedCount === idsToDelete.length) {
            showSuccessToast(`${deletedCount} workout${deletedCount > 1 ? 's' : ''} deleted`);
            exitSelectionMode();
          }
        },
      });
    });
  }, [hardDelete, selectedIds, exitSelectionMode]);

  const handleViewSession = useCallback((entry: Entry): void => {
    const subjectOrdinal = subjects?.find(s => s.id === entry.subject_id)?.ordinal;
    if (subjectOrdinal) {
      router.push({
        pathname: '/subject/[id]/entry/[entryId]',
        params: { id: String(subjectOrdinal), entryId: String(entry.ordinal) },
      });
    } else {
      showErrorToast('Unable to open session. Please try again.');
    }
  }, [subjects]);

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
        {/* Continue session banner */}
        {inProgressEntry && !isSelectionMode && (
          <Pressable
            onPress={handleContinueSession}
            style={{ cursor: 'pointer', userSelect: 'none' } as never}
          >
            <XStack
              backgroundColor="$purple5"
              paddingHorizontal="$4"
              paddingVertical="$3"
              alignItems="center"
              justifyContent="space-between"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <XStack alignItems="center" gap="$3">
                <Stack
                  width={32}
                  height={32}
                  borderRadius={16}
                  backgroundColor="$primary"
                  alignItems="center"
                  justifyContent="center"
                >
                  <MaterialCommunityIcons
                    name="play"
                    size={18}
                    color="white"
                  />
                </Stack>
                <YStack>
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Continue: {inProgressWorkoutName}
                  </Text>
                  <Text fontSize={12} color="$textMuted">
                    Session in progress
                  </Text>
                </YStack>
              </XStack>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.primary?.val ?? '#8B5CF6'}
              />
            </XStack>
          </Pressable>
        )}

        {/* Selection mode header */}
        {isSelectionMode && (
          <XStack
            backgroundColor="$error"
            paddingHorizontal="$4"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$3">
              <Pressable
                onPress={exitSelectionMode}
                style={{ cursor: 'pointer', userSelect: 'none' } as never}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="white"
                />
              </Pressable>
              <Text fontSize={17} fontWeight="600" color="white">
                {selectedIds.size} selected
              </Text>
            </XStack>
            <Pressable
              onPress={handleDeleteSelected}
              disabled={hardDelete.isPending}
              style={{ cursor: 'pointer', userSelect: 'none', opacity: hardDelete.isPending ? 0.5 : 1 } as never}
            >
              {hardDelete.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={24}
                  color="white"
                />
              )}
            </Pressable>
          </XStack>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: hasRecentSessions ? 70 : 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.primary?.val}
              colors={[theme.primary?.val ?? '#8B5CF6']}
              progressBackgroundColor={theme.backgroundHover?.val}
            />
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
              {!isSelectionMode && (
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
              )}

              {/* Workout cards */}
              <YStack gap="$3">
                {subjects?.map(subject => (
                  <WorkoutCardWithTemplate
                    key={subject.id}
                    subject={subject}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(subject.id)}
                    onPress={() => handleWorkoutPress(subject)}
                    onLongPress={() => handleWorkoutLongPress(subject)}
                    startingSubjectId={startingSubjectId}
                    setStartingSubjectId={setStartingSubjectId}
                    inProgressEntry={inProgressEntry}
                    onCompleteEntry={handleCompleteEntry}
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
                  backgroundColor="$purple5"
                  alignItems="center"
                  justifyContent="center"
                >
                  <MaterialCommunityIcons
                    name="history"
                    size={18}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                </Stack>
                <Text fontSize={14} fontWeight="600" color="$color">
                  Recent Sessions
                </Text>
                <Stack
                  backgroundColor="$purple5"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize={12} fontWeight="600" color="$primary">
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

type ActiveView = 'progress' | 'daily_log';

interface ViewSwitcherProps {
  activeView: ActiveView;
  onToggle: (view: ActiveView) => void;
}

function ViewSwitcher({ activeView, onToggle }: ViewSwitcherProps): React.ReactElement {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#27272A' : '#E4E4E7';
  const activeColor = isDark ? '#3F3F46' : '#FFFFFF';
  const textColor = isDark ? '#FAFAFA' : '#18181B';
  const mutedColor = isDark ? '#71717A' : '#A1A1AA';

  const options: { key: ActiveView; icon: 'dumbbell' | 'notebook-outline'; label: string }[] = [
    { key: 'progress', icon: 'dumbbell', label: 'Progress view' },
    { key: 'daily_log', icon: 'notebook-outline', label: 'Daily Log view' },
  ];

  return (
    <XStack
      backgroundColor={bgColor}
      borderRadius={8}
      padding={3}
      gap={2}
      marginRight={8}
    >
      {options.map(({ key, icon, label }) => {
        const isActive = activeView === key;
        return (
          <Pressable
            key={key}
            onPress={() => onToggle(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isActive }}
          >
            <Stack
              backgroundColor={isActive ? activeColor : 'transparent'}
              borderRadius={6}
              paddingVertical={5}
              paddingHorizontal={12}
              alignItems="center"
              justifyContent="center"
            >
              <MaterialCommunityIcons
                name={icon}
                size={18}
                color={isActive ? textColor : mutedColor}
              />
            </Stack>
          </Pressable>
        );
      })}
    </XStack>
  );
}

// Main export - switches between views via local state
export default function HomeScreen(): React.ReactElement {
  const [activeView, setActiveView] = useState<ActiveView>('progress');
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: activeView === 'progress' ? 'Progress' : 'Daily Log',
      headerRight: () => (
        <ViewSwitcher activeView={activeView} onToggle={setActiveView} />
      ),
    });
  }, [navigation, activeView]);

  if (activeView === 'daily_log') {
    return <DailyLogModule />;
  }

  return <WorkoutModule />;
}
