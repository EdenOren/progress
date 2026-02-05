import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollView, ActivityIndicator, Pressable, Modal, LayoutAnimation, Platform, UIManager } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate } from '@progress/shared';
import type { ItemWithSets } from '@progress/shared';
import { Card, Button, LoadingScreen, EmptyState, ExerciseInputCard } from '../../../src/components';
import { AddItemModal } from '../../../src/components/AddItemModal';
import {
  useEntryWithItems,
  useLastEntry,
  useCompleteEntry,
  useDeleteEntry,
} from '../../../src/hooks';
import { showSuccessToast } from '../../../src/utils';

export default function EntryScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id: string }>();
  const entryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: entry, isPending, isError } = useEntryWithItems(entryId ?? '');

  const { data: lastEntry } = useLastEntry(
    entry?.subject_id ?? '',
    entry?.performed_at
  );
  const completeEntry = useCompleteEntry();
  const deleteEntry = useDeleteEntry();

  // Reset delete mutation state on mount to prevent stale loader from previous screen
  useEffect(() => {
    deleteEntry.reset();
  }, []);

  const [showAddItem, setShowAddItem] = useState(false);
  const [showComparisonHint, setShowComparisonHint] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const theme = useTheme();

  // Disable scroll when content doesn't overflow
  useEffect(() => {
    if (contentHeight > 0 && containerHeight > 0) {
      setScrollEnabled(contentHeight > containerHeight);
    }
  }, [contentHeight, containerHeight]);

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Handle expanding an item (only one can be expanded at a time)
  const handleExpandItem = useCallback((itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItemId(itemId);
  }, []);

  // Handle feedback selection - collapse current item and auto-expand next item without feedback
  const handleFeedbackSelected = useCallback((itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!entry?.items) {
      setExpandedItemId(null);
      return;
    }
    // Find next item without feedback (excluding current item)
    const nextItem = entry.items.find(i => i.id !== itemId && !i.feedback);
    setExpandedItemId(nextItem?.id ?? null);
  }, [entry?.items]);

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

  // Format seconds to MM:SS or HH:MM:SS
  const formatTimer = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = (): void => {
    if (!entryId || completeEntry.isPending) return;
    completeEntry.mutate(entryId, {
      onSuccess: () => {
        // Save final duration and show summary
        setFinalDuration(elapsedSeconds);
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

  // Find matching item from last session by name or exercise_id
  const getLastSessionItem = (item: ItemWithSets): ItemWithSets | null => {
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
  };

  // Show loading while we don't have data yet
  // isPending = no cached data (React Query v5)
  if (!entryId || isPending) {
    return <LoadingScreen />;
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
            <XStack alignItems="center" gap={8}>
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
                  disabled={completeEntry.isPending}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: completeEntry.isPending ? 'rgba(139, 92, 246, 0.5)' : (theme.primary?.val ?? '#8B5CF6'),
                    borderRadius: 16,
                    cursor: completeEntry.isPending ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                  } as never}
                >
                  {completeEntry.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                      Complete
                    </Text>
                  )}
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
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
          onContentSizeChange={(_, height) => setContentHeight(height)}
        >
          {/* Status */}
          <Stack marginBottom={16}>
            <Card>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={14} color="$textSecondary">
                  Status
                </Text>
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
              <Button
                variant="ghost"
                size="small"
                onPress={() => setShowAddItem(true)}
              >
                + Add
              </Button>
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
                  lastSessionItem={showComparisonHint ? getLastSessionItem(item) : null}
                  isSessionInProgress={!entry.is_completed}
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
                        {entry.items.length}
                      </Text>
                      <Text fontSize={12} color="$textMuted">Exercises</Text>
                    </YStack>
                  </XStack>
                  <XStack gap={24}>
                    <YStack alignItems="center">
                      <Text fontSize={18} fontWeight="600" color="$success">
                        {entry.items.filter(i => i.feedback?.rating === 'done').length}
                      </Text>
                      <Text fontSize={11} color="$textMuted">Done</Text>
                    </YStack>
                    <YStack alignItems="center">
                      <Text fontSize={18} fontWeight="600" color="$primary">
                        {entry.items.filter(i => i.feedback?.rating === 'up').length}
                      </Text>
                      <Text fontSize={11} color="$textMuted">Up</Text>
                    </YStack>
                  </XStack>
                </YStack>

                {/* Done Button */}
                <Pressable
                  onPress={handleDismissSummary}
                  style={{
                    backgroundColor: theme.primary?.val ?? '#8B5CF6',
                    paddingHorizontal: 32,
                    paddingVertical: 12,
                    borderRadius: 24,
                    marginTop: 8,
                  }}
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
