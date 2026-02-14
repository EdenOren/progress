import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, ActivityIndicator, Pressable, Modal, LayoutAnimation } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate, formatDuration } from '@progress/shared';
import type { ItemWithSets } from '@progress/shared';
import { Card, Button, LoadingScreen, EmptyState, ExerciseInputCard } from '../../../../../src/components';
import { AddItemModal } from '../../../../../src/components/AddItemModal';
import {
  useSubjectByOrdinal,
  useEntryWithItemsByOrdinal,
  useLastEntry,
  useUpdateEntry,
  useDeleteEntry,
} from '../../../../../src/hooks';
import { showSuccessToast } from '../../../../../src/utils';
import type { EntryWithItems } from '@progress/shared';

/** Format seconds to MM:SS or HH:MM:SS */
function formatTimer(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Find matching item from last session by exercise_id or name */
function getLastSessionItem(
  item: ItemWithSets,
  lastEntry: EntryWithItems | null | undefined
): ItemWithSets | null {
  if (!lastEntry) return null;

  // Try to match by exercise_id first if available
  const itemWithExercise = item as ItemWithSets & { exercise_id?: string };
  if (itemWithExercise.exercise_id) {
    const matchById = lastEntry.items.find(
      (lastItem) => (lastItem as ItemWithSets & { exercise_id?: string }).exercise_id === itemWithExercise.exercise_id
    );
    if (matchById) return matchById;
  }

  // Fall back to matching by name (case-insensitive)
  return lastEntry.items.find(
    (lastItem) => lastItem.name.toLowerCase() === item.name.toLowerCase()
  ) ?? null;
}

export default function EntryScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string; entryId: string }>();
  const subjectOrdinal = Number(params.id);
  const entryOrdinal = Number(params.entryId);
  const isValidParams = Number.isInteger(subjectOrdinal) && subjectOrdinal >= 1 &&
    Number.isInteger(entryOrdinal) && entryOrdinal >= 1;

  // Resolve subject ordinal to UUID
  const { data: subject, isLoading: subjectLoading, isError: subjectError } = useSubjectByOrdinal(isValidParams ? subjectOrdinal : -1);
  const subjectId = subject?.id ?? '';

  // Resolve entry ordinal to full entry with items
  const { data: entry, isPending, isError } = useEntryWithItemsByOrdinal(subjectId, isValidParams ? entryOrdinal : -1);

  const entryId = entry?.id ?? '';

  const { data: lastEntry } = useLastEntry(
    entry?.subject_id ?? '',
    entry?.id  // Exclude current entry by ID
  );
  const queryClient = useQueryClient();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  // Reset delete mutation state on mount to prevent stale loader from previous screen
  useEffect(() => {
    deleteEntry.reset();
  }, []);

  const [showAddItem, setShowAddItem] = useState(false);
  const [showComparisonHint, setShowComparisonHint] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const [finalStats, setFinalStats] = useState({ done: 0, up: 0, total: 0 });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  // Track items that have been marked with feedback this session (to handle stale data)
  const [markedItems, setMarkedItems] = useState<Map<string, 'done' | 'up'>>(new Map());
  const theme = useTheme();

  if (!isValidParams) {
    return (
      <EmptyState
        title="Invalid URL"
        message="This session URL is not valid"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  // Disable scroll when content doesn't overflow
  useEffect(() => {
    if (contentHeight > 0 && containerHeight > 0) {
      setScrollEnabled(contentHeight > containerHeight);
    }
  }, [contentHeight, containerHeight]);

  // Handle expanding an item (only one can be expanded at a time)
  const handleExpandItem = useCallback((itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItemId(itemId);
  }, []);

  // Toggle edit mode for completed sessions
  const handleToggleEditMode = useCallback(() => {
    if (isEditMode) {
      // Exiting edit mode: collapse any expanded item
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedItemId(null);
    }
    setIsEditMode(prev => !prev);
  }, [isEditMode]);

  // Handle feedback selection - collapse current item and auto-expand next item without feedback
  const handleFeedbackSelected = useCallback((itemId: string, rating: 'done' | 'up') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Track this item as marked with its rating (handles stale data issue)
    setMarkedItems(prev => new Map(prev).set(itemId, rating));

    if (!entry?.items) {
      setExpandedItemId(null);
      return;
    }

    // Find next item without feedback (excluding current item and any we've marked this session)
    const nextItem = entry.items.find(i =>
      i.id !== itemId &&
      !i.feedback &&
      !markedItems.has(i.id)
    );
    setExpandedItemId(nextItem?.id ?? null);
  }, [entry?.items, markedItems]);

  // Sort items: expanded first, then no feedback, then with feedback at bottom
  const sortedItems = useMemo(() => {
    if (!entry?.items) return [];
    return [...entry.items].sort((a, b) => {
      // Expanded item always first
      if (a.id === expandedItemId) return -1;
      if (b.id === expandedItemId) return 1;

      // Items with feedback go to bottom
      const aHasFeedback = a.feedback !== null;
      const bHasFeedback = b.feedback !== null;
      if (aHasFeedback !== bHasFeedback) {
        return aHasFeedback ? 1 : -1;
      }

      // Maintain original position for others
      return 0;
    });
  }, [entry?.items, expandedItemId]);

  // Session timer - track elapsed time for in-progress sessions
  useEffect(() => {
    if (!entry || entry.is_completed) return;

    // Calculate initial elapsed time from started_at or created_at
    const startTime = entry.started_at ?? entry.created_at;
    const startDate = new Date(startTime);
    const initialElapsed = Math.floor((Date.now() - startDate.getTime()) / 1000);
    setElapsedSeconds(Math.max(0, initialElapsed));

    // Update every second
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startDate.getTime()) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [entry?.id, entry?.is_completed, entry?.started_at, entry?.created_at]);

  const handleComplete = (): void => {
    if (!entryId || updateEntry.isPending || !entry) return;

    // Capture stats - combine server data with locally tracked feedback (handles stale data)
    let doneCount = 0;
    let upCount = 0;

    entry.items.forEach(item => {
      // Check local tracked feedback first (more recent), then server data
      const localRating = markedItems.get(item.id);
      const rating = localRating ?? item.feedback?.rating;

      if (rating === 'done') doneCount++;
      else if (rating === 'up') upCount++;
    });

    const now = new Date().toISOString();

    updateEntry.mutate({
      entryId,
      updates: {
        is_completed: true,
        completed_at: now,
        duration_seconds: elapsedSeconds,
      },
    }, {
      onSuccess: () => {
        // Invalidate recent entries and stats since completion changes them
        queryClient.invalidateQueries({ queryKey: ['entries', 'recent'] });
        queryClient.invalidateQueries({ queryKey: ['subjects', 'withStats'] });
        // Save final duration and stats, then show summary
        setFinalDuration(elapsedSeconds);
        setFinalStats({ done: doneCount, up: upCount, total: entry.items.length });
        setShowSummary(true);
      },
    });
  };

  const handleDismissSummary = (): void => {
    setShowSummary(false);
    router.replace('/');
  };

  const handleDelete = (): void => {
    if (!entry || deleteEntry.isPending) return;
    deleteEntry.mutate(
      { entryId: entry.id, subjectId: entry.subject_id },
      {
        onSuccess: () => {
          showSuccessToast('Session deleted successfully');
          router.back();
        },
      }
    );
  };

  // Show error if subject resolution failed
  if (subjectError) {
    return (
      <EmptyState
        title="Not Found"
        message="This workout could not be found"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  // Show loading while resolving subject or entry
  if (subjectLoading || !subjectId || isPending) {
    return (
      <>
        <RouterStack.Screen options={{ title: 'Loading...' }} />
        <LoadingScreen />
      </>
    );
  }

  // Only show error if we actually tried to fetch and failed
  if (isError) {
    return (
      <EmptyState
        title="Error"
        message="Failed to load session. Please try again."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  if (!entry) {
    return (
      <EmptyState
        title="Not Found"
        message="This session could not be found"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <RouterStack.Screen
        options={{
          title: formatDate(entry.performed_at),
          headerBackTitle: 'Back',
          headerRight: () => (
            <XStack alignItems="center" gap="$3">
              {/* Timer - only show for in-progress sessions */}
              {!entry.is_completed && (
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textMuted?.val ?? '#888', fontVariant: ['tabular-nums'] }}>
                  {formatTimer(elapsedSeconds)}
                </Text>
              )}
              {/* Complete button - only show for in-progress sessions */}
              {!entry.is_completed && (
                <Pressable
                  onPress={handleComplete}
                  disabled={updateEntry.isPending}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: updateEntry.isPending ? 'rgba(139, 92, 246, 0.5)' : (theme.primary?.val ?? '#8B5CF6'),
                    borderRadius: 16,
                    cursor: updateEntry.isPending ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    opacity: pressed ? 0.7 : 1,
                  }) as never}
                >
                  {updateEntry.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                      Complete
                    </Text>
                  )}
                </Pressable>
              )}
              {/* Edit mode toggle - only show for completed sessions */}
              {entry.is_completed && (
                <Pressable
                  onPress={handleToggleEditMode}
                  style={{ padding: 8, cursor: 'pointer', userSelect: 'none' } as never}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={isEditMode ? 'pencil-off' : 'pencil-outline'}
                    size={22}
                    color={isEditMode ? (theme.primary?.val ?? '#8B5CF6') : (theme.textMuted?.val ?? '#71717A')}
                  />
                </Pressable>
              )}
              {/* Delete button - only show for completed sessions */}
              {entry.is_completed && (
                deleteEntry.isPending ? (
                  <ActivityIndicator size="small" color={theme.error?.val} />
                ) : (
                  <Pressable
                    onPress={handleDelete}
                    style={{ padding: 8, cursor: 'pointer', userSelect: 'none' } as never}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={22}
                      color={theme.error?.val ?? '#EF4444'}
                    />
                  </Pressable>
                )
              )}
            </XStack>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
        {/* Progress bar - shows completion based on exercises with feedback */}
        {!entry.is_completed && entry.items.length > 0 && (
          <Stack
            height={4}
            backgroundColor="$backgroundHover"
          >
            <Stack
              height={4}
              backgroundColor="$primary"
              width={`${(entry.items.filter(item => item.feedback !== null).length / entry.items.length) * 100}%`}
            />
          </Stack>
        )}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          scrollEnabled={scrollEnabled}
          keyboardShouldPersistTaps="handled"
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
        >
          {/* Status */}
          <Stack marginBottom={16}>
            <Card>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack alignItems="center" gap="$2">
                  <Text fontSize={14} color="$textSecondary">
                    Status
                  </Text>
                  {entry.is_completed && entry.duration_seconds != null && (
                    <Text fontSize={13} color="$textMuted">
                      {formatDuration(entry.duration_seconds)}
                    </Text>
                  )}
                </XStack>
                {entry.is_completed ? (
                  <Stack
                    backgroundColor="rgba(16, 185, 129, 0.15)"
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={9999}
                  >
                    <Text fontSize={13} color="$success" fontWeight="600">
                      Completed
                    </Text>
                  </Stack>
                ) : (
                  <Stack
                    backgroundColor="$purple5"
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={9999}
                  >
                    <Text fontSize={13} color="$primary" fontWeight="600">
                      In Progress
                    </Text>
                  </Stack>
                )}
              </XStack>
            </Card>
          </Stack>

          {/* Last time comparison hint - tappable to toggle */}
          {lastEntry && (
            <Pressable
              onPress={() => setShowComparisonHint(!showComparisonHint)}
              style={{ marginBottom: 16, cursor: 'pointer', userSelect: 'none' } as never}
            >
              <Card backgroundColor="$purple5">
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap={8} flex={1}>
                    <MaterialCommunityIcons
                      name="history"
                      size={16}
                      color={theme.primary?.val ?? '#8B5CF6'}
                    />
                    <Text fontSize={13} color="$primary" flex={1}>
                      {showComparisonHint
                        ? `Comparing with ${formatDate(lastEntry.performed_at)}`
                        : 'Tap to show last session comparison'}
                    </Text>
                  </XStack>
                  <MaterialCommunityIcons
                    name={showComparisonHint ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                </XStack>
              </Card>
            </Pressable>
          )}

          {/* Items list */}
          <YStack gap={16}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize={18} fontWeight="600" color="$color">
                Exercises
              </Text>
              {(!entry.is_completed || isEditMode) && (
                <Button
                  variant="ghost"
                  size="small"
                  onPress={() => setShowAddItem(true)}
                >
                  + Add
                </Button>
              )}
            </XStack>

            {entry.items.length === 0 ? (
              <Card>
                <YStack alignItems="center" padding={16} gap={12}>
                  <Text color="$textSecondary" textAlign="center">
                    No exercises yet. Add your first exercise to get started.
                  </Text>
                  <Button
                    variant="primary"
                    size="small"
                    onPress={() => setShowAddItem(true)}
                  >
                    Add Exercise
                  </Button>
                </YStack>
              </Card>
            ) : (
              sortedItems.map((item) => (
                <ExerciseInputCard
                  key={item.id}
                  item={item}
                  entryId={entry.id}
                  lastSessionItem={showComparisonHint ? getLastSessionItem(item, lastEntry) : null}
                  isSessionInProgress={!entry.is_completed}
                  isEditable={isEditMode}
                  isCollapsed={item.id !== expandedItemId}
                  onExpand={() => handleExpandItem(item.id)}
                  onFeedbackSelected={handleFeedbackSelected}
                />
              ))
            )}
          </YStack>

          {/* Notes */}
          {entry.notes && (
            <Stack marginTop={16}>
              <Card>
                <YStack gap={8}>
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Notes
                  </Text>
                  <Text fontSize={14} color="$textSecondary">
                    {entry.notes}
                  </Text>
                </YStack>
              </Card>
            </Stack>
          )}
        </ScrollView>

        <AddItemModal
          visible={showAddItem}
          onClose={() => setShowAddItem(false)}
          entryId={entry.id}
          subjectId={entry.subject_id}
        />

        {/* Session Summary Modal */}
        <Modal
          visible={showSummary}
          animationType="fade"
          transparent
          onRequestClose={handleDismissSummary}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
            onPress={handleDismissSummary}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <Stack
                backgroundColor="$surface"
                borderRadius={16}
                padding={24}
                alignItems="center"
                gap={16}
                minWidth={280}
              >
                {/* Success Icon */}
                <Stack
                  width={64}
                  height={64}
                  borderRadius={32}
                  backgroundColor="rgba(16, 185, 129, 0.15)"
                  alignItems="center"
                  justifyContent="center"
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={36}
                    color={theme.success?.val ?? '#10B981'}
                  />
                </Stack>

                {/* Title */}
                <Text fontSize={20} fontWeight="700" color="$color">
                  Great Workout!
                </Text>

                {/* Stats */}
                <YStack gap={8} alignItems="center">
                  <XStack gap={16}>
                    <YStack alignItems="center">
                      <Text fontSize={24} fontWeight="700" color="$primary">
                        {formatTimer(finalDuration)}
                      </Text>
                      <Text fontSize={12} color="$textMuted">Duration</Text>
                    </YStack>
                    <YStack alignItems="center">
                      <Text fontSize={24} fontWeight="700" color="$primary">
                        {finalStats.total}
                      </Text>
                      <Text fontSize={12} color="$textMuted">Exercises</Text>
                    </YStack>
                  </XStack>
                  <XStack gap={24}>
                    <YStack alignItems="center">
                      <Text fontSize={18} fontWeight="600" color="$success">
                        {finalStats.done}
                      </Text>
                      <Text fontSize={11} color="$textMuted">Done</Text>
                    </YStack>
                    <YStack alignItems="center">
                      <Text fontSize={18} fontWeight="600" color="$primary">
                        {finalStats.up}
                      </Text>
                      <Text fontSize={11} color="$textMuted">Up</Text>
                    </YStack>
                  </XStack>
                </YStack>

                {/* Done Button */}
                <Pressable
                  onPress={handleDismissSummary}
                  style={({ pressed }) => ({
                    backgroundColor: theme.primary?.val ?? '#8B5CF6',
                    paddingHorizontal: 32,
                    paddingVertical: 12,
                    borderRadius: 24,
                    marginTop: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
                    Done
                  </Text>
                </Pressable>
              </Stack>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </>
  );
}
