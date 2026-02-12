import React, { useState, useEffect, useRef } from 'react';
import { TextInput, Pressable, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSet,
  updateSet,
  deleteSet,
  setFeedback,
  formatDuration,
  formatDistance,
  type ItemWithSets,
  type ItemSet,
  type FeedbackRating,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { useUpdateItem, useDeleteItem } from '../hooks';
import { handleError, showSuccessToast, showAlert } from '../utils';
import { Card } from './Card';
import { Button } from './Button';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExerciseInputCardProps {
  item: ItemWithSets;
  entryId: string;
  lastSessionItem?: ItemWithSets | null;
  isSessionInProgress?: boolean;
  isEditable?: boolean;
  isCollapsed?: boolean;
  onExpand?: () => void;
  onFeedbackSelected?: (itemId: string, rating: FeedbackRating) => void;
}

interface LocalSetState {
  id: string;
  weight: string;
  reps: string;
  duration: string;
  distance: string;
  isDirty: boolean;
}

// Helper: Convert seconds to MM:SS string
function secondsToMMSS(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds === 0) return '';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return secs.toString();
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper: Parse MM:SS or plain seconds string to total seconds
function parseTimeInput(input: string): number | null {
  if (!input || input.trim() === '') return null;
  const trimmed = input.trim();

  // Handle MM:SS format
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
  }

  // Handle plain number (treat as seconds)
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

// Helper: Format an item's sets into a readable summary string
function formatSetsSummary(sets: ItemSet[], trackingType: string): string | null {
  if (sets.length === 0) return null;

  if (trackingType === 'duration') {
    const durations = sets
      .filter((s) => s.duration_sec !== null)
      .map((s) => formatDuration(s.duration_sec!));
    return durations.length > 0 ? durations.join(' · ') : null;
  }

  if (trackingType === 'distance') {
    const distances = sets
      .filter((s) => s.distance_m !== null)
      .map((s) => {
        const distStr = formatDistance(s.distance_m!);
        if (s.duration_sec !== null) {
          return `${distStr} in ${formatDuration(s.duration_sec)}`;
        }
        return distStr;
      });
    return distances.length > 0 ? distances.join(' · ') : null;
  }

  const setStrings = sets
    .filter((s) => s.weight_kg !== null || s.reps !== null)
    .map((s) => {
      if (s.weight_kg !== null && s.reps !== null) {
        return `${s.weight_kg}kg×${s.reps}`;
      } else if (s.weight_kg !== null) {
        return `${s.weight_kg}kg`;
      } else if (s.reps !== null) {
        return `${s.reps} reps`;
      }
      return '';
    })
    .filter(Boolean);

  return setStrings.length > 0 ? setStrings.join(' · ') : null;
}

export function ExerciseInputCard({
  item,
  entryId,
  lastSessionItem,
  isSessionInProgress = false,
  isEditable = false,
  isCollapsed = false,
  onExpand,
  onFeedbackSelected,
}: ExerciseInputCardProps): React.ReactElement {
  const { user } = useSupabaseContext();
  const queryClient = useQueryClient();
  const theme = useTheme();

  // canEdit: true when session is in-progress OR edit mode is active on a completed session
  const canEdit = isSessionInProgress || isEditable;

  const trackingType = (item as ItemWithSets & { tracking_type?: string }).tracking_type ?? 'weight_reps';

  // Local state for set inputs - allows typing without lag
  const [localSets, setLocalSets] = useState<LocalSetState[]>(() =>
    item.sets.map((set) => ({
      id: set.id,
      weight: set.weight_kg?.toString() ?? '',
      reps: set.reps?.toString() ?? '',
      // Use MM:SS format for distance tracking, plain seconds for duration tracking
      duration: trackingType === 'distance'
        ? secondsToMMSS(set.duration_sec)
        : (set.duration_sec?.toString() ?? ''),
      distance: set.distance_m ? (set.distance_m / 1000).toString() : '',
      isDirty: false,
    }))
  );

  // Track which sets are currently being saved or deleted
  const [savingSets, setSavingSets] = useState<Set<string>>(new Set());
  const [deletingSets, setDeletingSets] = useState<Set<string>>(new Set());
  const [copiedSetIndex, setCopiedSetIndex] = useState<number | null>(null);

  // Track optimistic feedback (shown immediately before server data updates)
  const [optimisticFeedback, setOptimisticFeedback] = useState<FeedbackRating | null>(null);

  // Note state
  const [localNote, setLocalNote] = useState(item.note ?? '');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const localNoteRef = useRef(localNote);
  localNoteRef.current = localNote;

  // Refs to track the latest values for blur handlers
  const localSetsRef = useRef(localSets);
  localSetsRef.current = localSets;

  // Sync local state when item.sets changes from server
  useEffect(() => {
    setLocalSets(
      item.sets.map((set) => ({
        id: set.id,
        weight: set.weight_kg?.toString() ?? '',
        reps: set.reps?.toString() ?? '',
        // Use MM:SS format for distance tracking, plain seconds for duration tracking
        duration: trackingType === 'distance'
          ? secondsToMMSS(set.duration_sec)
          : (set.duration_sec?.toString() ?? ''),
        distance: set.distance_m ? (set.distance_m / 1000).toString() : '',
        isDirty: false,
      }))
    );
  }, [item.sets, trackingType]);

  // Clear optimistic feedback when server data catches up
  useEffect(() => {
    if (item.feedback?.rating) {
      setOptimisticFeedback(null);
    }
  }, [item.feedback?.rating]);

  // Sync note state when item.note changes from server
  useEffect(() => {
    setLocalNote(item.note ?? '');
  }, [item.note]);

  // Update item mutation (for notes)
  const updateItemMutation = useUpdateItem(entryId);

  // Delete item mutation (for removing exercise from entry)
  const deleteItemMutation = useDeleteItem(entryId);

  // Format last session's sets as reference text
  const lastRef = lastSessionItem
    ? formatSetsSummary(lastSessionItem.sets, trackingType)
    : null;

  // Update set mutation (auto-save on blur)
  const updateSetMutation = useMutation({
    mutationFn: async ({
      setId,
      weight_kg,
      reps,
      duration_sec,
      distance_m,
    }: {
      setId: string;
      weight_kg: number | null;
      reps: number | null;
      duration_sec: number | null;
      distance_m?: number | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await updateSet(user.id, setId, {
        weight_kg,
        reps,
        duration_sec,
        distance_m,
      });
      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => handleError(error),
  });

  // Add set mutation
  const addSetMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const result = await createSet({
        item_id: item.id,
        user_id: user.id,
        set_index: item.sets.length,
        weight_kg: null,
        reps: null,
      });
      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => handleError(error),
  });

  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      if (!user) throw new Error('Not authenticated');
      const result = await deleteSet(user.id, setId);
      if (!result.success) throw result.error;
    },
    onSuccess: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => handleError(error),
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (rating: FeedbackRating) => {
      if (!user) throw new Error('Not authenticated');
      const result = await setFeedback({
        item_id: item.id,
        user_id: user.id,
        rating,
      });
      if (!result.success) throw result.error;
      return result.data;
    },
    onMutate: (rating) => {
      // Set optimistic feedback immediately for UI responsiveness
      setOptimisticFeedback(rating);
    },
    onSuccess: (_, rating) => {
      // Notify parent FIRST (before query invalidation) to update accordion state
      onFeedbackSelected?.(item.id, rating);
      // Then refetch data
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => {
      // Clear optimistic feedback on error
      setOptimisticFeedback(null);
      handleError(error);
    },
  });

  // Handle input change (just updates local state)
  const handleInputChange = (
    setIndex: number,
    field: 'weight' | 'reps' | 'duration' | 'distance',
    value: string
  ): void => {
    setLocalSets((prev) =>
      prev.map((s, i) =>
        i === setIndex ? { ...s, [field]: value, isDirty: true } : s
      )
    );
  };

  // Handle blur - auto-save if dirty
  const handleBlur = async (setIndex: number): Promise<void> => {
    const localSet = localSetsRef.current[setIndex];
    if (!localSet || !localSet.isDirty) return;

    const serverSet = item.sets[setIndex];
    if (!serverSet) return;

    const weight_kg = localSet.weight ? parseFloat(localSet.weight) : null;
    const reps = localSet.reps ? parseInt(localSet.reps, 10) : null;
    // For distance tracking, parse MM:SS format; for duration tracking, parse plain seconds
    const duration_sec = trackingType === 'distance'
      ? parseTimeInput(localSet.duration)
      : (localSet.duration ? parseInt(localSet.duration, 10) : null);
    // Convert km to meters for storage
    const distance_m = localSet.distance ? Math.round(parseFloat(localSet.distance) * 1000) : null;

    // Check if values actually changed
    const weightChanged = weight_kg !== serverSet.weight_kg;
    const repsChanged = reps !== serverSet.reps;
    const durationChanged = duration_sec !== serverSet.duration_sec;
    const distanceChanged = distance_m !== serverSet.distance_m;

    if (!weightChanged && !repsChanged && !durationChanged && !distanceChanged) {
      // Mark as not dirty if nothing changed
      setLocalSets((prev) =>
        prev.map((s, i) => (i === setIndex ? { ...s, isDirty: false } : s))
      );
      return;
    }

    setSavingSets((prev) => new Set(prev).add(serverSet.id));

    try {
      await updateSetMutation.mutateAsync({
        setId: serverSet.id,
        weight_kg,
        reps,
        duration_sec,
        distance_m,
      });
      // Animate layout change when set is saved
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLocalSets((prev) =>
        prev.map((s, i) => (i === setIndex ? { ...s, isDirty: false } : s))
      );
    } finally {
      setSavingSets((prev) => {
        const next = new Set(prev);
        next.delete(serverSet.id);
        return next;
      });
    }
  };

  // Copy from last session for a specific set
  const handleCopySet = async (setIndex: number): Promise<void> => {
    if (!lastSessionItem) return;
    const lastSet = lastSessionItem.sets[setIndex];
    if (!lastSet) return;

    const serverSet = item.sets[setIndex];
    if (!serverSet) return;

    // Update local state immediately
    setLocalSets((prev) =>
      prev.map((s, i) =>
        i === setIndex
          ? {
              ...s,
              weight: lastSet.weight_kg?.toString() ?? '',
              reps: lastSet.reps?.toString() ?? '',
              // Use MM:SS format for distance tracking
              duration: trackingType === 'distance'
                ? secondsToMMSS(lastSet.duration_sec)
                : (lastSet.duration_sec?.toString() ?? ''),
              distance: lastSet.distance_m ? (lastSet.distance_m / 1000).toString() : '',
              isDirty: true,
            }
          : s
      )
    );

    // Show visual feedback
    setCopiedSetIndex(setIndex);
    setTimeout(() => setCopiedSetIndex(null), 500);

    // Auto-save
    setSavingSets((prev) => new Set(prev).add(serverSet.id));
    try {
      await updateSetMutation.mutateAsync({
        setId: serverSet.id,
        weight_kg: lastSet.weight_kg,
        reps: lastSet.reps,
        duration_sec: lastSet.duration_sec ?? null,
        distance_m: lastSet.distance_m ?? null,
      });
      // Animate layout change when set is copied
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setLocalSets((prev) =>
        prev.map((s, i) => (i === setIndex ? { ...s, isDirty: false } : s))
      );
    } finally {
      setSavingSets((prev) => {
        const next = new Set(prev);
        next.delete(serverSet.id);
        return next;
      });
    }
  };

  // Handle note blur - auto-save
  const handleNoteBlur = async (): Promise<void> => {
    const currentNote = localNoteRef.current;
    const serverNote = item.note ?? '';

    // Check if note actually changed
    if (currentNote === serverNote) {
      return;
    }

    // Save the note (empty string becomes null)
    const noteValue = currentNote.trim() || null;
    updateItemMutation.mutate({
      itemId: item.id,
      updates: { note: noteValue },
    });
  };

  // Handle delete exercise
  const handleDeleteExercise = (): void => {
    showAlert(
      'Delete Exercise',
      `Remove "${item.name}" and all its sets from this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItemMutation.mutate(item.id, {
              onSuccess: () => showSuccessToast('Exercise removed'),
            });
          },
        },
      ]
    );
  };

  const getFeedbackColor = (rating: FeedbackRating): string => {
    switch (rating) {
      case 'done':
        return '$success';
      case 'up':
        return '$primary';
    }
  };

  const getFeedbackIcon = (rating: FeedbackRating): 'check-circle' | 'arrow-up-circle' => {
    switch (rating) {
      case 'done':
        return 'check-circle';
      case 'up':
        return 'arrow-up-circle';
    }
  };

  const getFeedbackThemeColor = (rating: FeedbackRating): string => {
    switch (rating) {
      case 'done':
        return theme.success?.val ?? '#10B981';
      case 'up':
        return theme.primary?.val ?? '#8B5CF6';
    }
  };

  // Collapsed view - shown when isCollapsed is true
  if (isCollapsed) {
    const completedSets = item.sets.filter(s => (s.weight_kg !== null || s.reps !== null || s.duration_sec !== null || s.distance_m !== null)).length;
    const totalSets = item.sets.length;
    // Use optimistic feedback if server data hasn't caught up yet
    const feedbackRating = item.feedback?.rating ?? optimisticFeedback;
    const hasFeedback = !!feedbackRating;
    // Last session info for collapsed view
    const lastFeedback = lastSessionItem?.feedback?.rating;
    // Set summary for completed sessions
    const currentSetSummary = !isSessionInProgress ? formatSetsSummary(item.sets, trackingType) : null;
    const lastSetSummary = lastSessionItem ? formatSetsSummary(lastSessionItem.sets, trackingType) : null;

    return (
      <Pressable
        onPress={onExpand}
        disabled={!onExpand}
        style={{ cursor: onExpand ? 'pointer' : 'default', userSelect: 'none' } as never}
      >
        <Card>
          <XStack alignItems="center" gap="$3" paddingVertical="$1">
            {/* Icon indicator */}
            <Stack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor={
                hasFeedback
                  ? (feedbackRating === 'done' ? 'rgba(16, 185, 129, 0.15)' : '$purple5')
                  : '$backgroundHover'
              }
              alignItems="center"
              justifyContent="center"
            >
              <MaterialCommunityIcons
                name={hasFeedback ? getFeedbackIcon(feedbackRating!) : 'dumbbell'}
                size={18}
                color={
                  hasFeedback
                    ? getFeedbackThemeColor(feedbackRating!)
                    : (theme.textMuted?.val ?? '#71717A')
                }
              />
            </Stack>

            {/* Exercise name and summary */}
            <YStack flex={1}>
              <Text fontSize={14} fontWeight="600" color="$color">
                {item.name}
              </Text>
              {/* Subtitle area - different content based on session state */}
              {!isSessionInProgress && currentSetSummary ? (
                /* Completed session: show feedback label + set details and optional note */
                <YStack>
                  <XStack alignItems="center" gap="$1">
                    {feedbackRating && (
                      <>
                        <Text
                          fontSize={11}
                          fontWeight="600"
                          color={feedbackRating === 'done' ? '$success' : '$primary'}
                        >
                          {feedbackRating === 'done' ? 'Done' : 'Up'}
                        </Text>
                        <Text fontSize={11} color="$textMuted">·</Text>
                      </>
                    )}
                    <Text fontSize={11} color="$textMuted" numberOfLines={1} flex={1}>
                      {currentSetSummary}
                    </Text>
                  </XStack>
                  {item.note && (
                    <Text fontSize={11} color="$textMuted" numberOfLines={1} fontStyle="italic">
                      "{item.note}"
                    </Text>
                  )}
                </YStack>
              ) : hasFeedback && isSessionInProgress ? (
                /* Active session with feedback: show sets completed */
                <Text fontSize={12} color="$textMuted">
                  {completedSets}/{totalSets} sets completed
                </Text>
              ) : !hasFeedback && isSessionInProgress && lastFeedback ? (
                /* Active session, no feedback yet, has last session data */
                <YStack>
                  <XStack alignItems="center" gap="$1">
                    <Text fontSize={11} color="$textMuted">
                      Last:
                    </Text>
                    <MaterialCommunityIcons
                      name={lastFeedback === 'done' ? 'check-circle' : 'arrow-up-circle'}
                      size={11}
                      color={lastFeedback === 'done'
                        ? (theme.success?.val ?? '#10B981')
                        : (theme.primary?.val ?? '#8B5CF6')}
                    />
                    <Text
                      fontSize={11}
                      color={lastFeedback === 'done' ? '$success' : '$primary'}
                      fontWeight="500"
                    >
                      {lastFeedback === 'done' ? 'Done' : 'Up'}
                    </Text>
                    {lastSetSummary && (
                      <Text fontSize={11} color="$textMuted" numberOfLines={1} flex={1}>
                        · {lastSetSummary}
                      </Text>
                    )}
                  </XStack>
                  {lastSessionItem?.note && (
                    <Text fontSize={11} color="$textMuted" numberOfLines={1} fontStyle="italic">
                      "{lastSessionItem.note}"
                    </Text>
                  )}
                </YStack>
              ) : !hasFeedback && isSessionInProgress && !lastFeedback && lastSetSummary ? (
                /* Active session, no feedback, no last feedback but has last sets */
                <Text fontSize={11} color="$textMuted" numberOfLines={1}>
                  Last: {lastSetSummary}
                </Text>
              ) : (
                /* Default: tap to start or set count */
                <Text fontSize={12} color={isSessionInProgress ? '$primary' : '$textMuted'}>
                  {isSessionInProgress ? 'Tap to start' : `${totalSets} sets`}
                </Text>
              )}
            </YStack>

            {/* Feedback badge or chevron indicator */}
            {hasFeedback ? (
              <Stack
                backgroundColor={feedbackRating === 'done' ? 'rgba(16, 185, 129, 0.15)' : '$purple5'}
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={9999}
              >
                <Text
                  fontSize={12}
                  fontWeight="600"
                  color={feedbackRating === 'done' ? '$success' : '$primary'}
                >
                  {feedbackRating === 'done' ? 'Done' : 'Up \u2191'}
                </Text>
              </Stack>
            ) : onExpand ? (
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.textMuted?.val ?? '#71717A'}
              />
            ) : null}
          </XStack>
        </Card>
      </Pressable>
    );
  }

  return (
    <Card>
      <YStack gap="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="600" color="$color">
              {item.name}
            </Text>
            {/* Display existing note (when not editing) */}
            {item.note && !showNoteInput && (
              <Text fontSize={13} color="$secondary" marginTop="$1" fontStyle="italic">
                "{item.note}"
              </Text>
            )}
          </YStack>
          <XStack gap="$2">
            {/* Note icon button */}
            <Pressable
              onPress={() => setShowNoteInput(!showNoteInput)}
              style={{ cursor: 'pointer', userSelect: 'none' } as never}
            >
              <Stack
                width={32}
                height={32}
                borderRadius="$2"
                alignItems="center"
                justifyContent="center"
                backgroundColor={item.note || showNoteInput ? '$blue5' : '$backgroundHover'}
              >
                {updateItemMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.blue10?.val ?? '#3B82F6'} />
                ) : (
                  <MaterialCommunityIcons
                    name={item.note ? 'note-text' : 'note-plus-outline'}
                    size={18}
                    color={item.note || showNoteInput ? (theme.blue10?.val ?? '#3B82F6') : (theme.textMuted?.val ?? '#71717A')}
                  />
                )}
              </Stack>
            </Pressable>

            {/* Delete exercise button - show only in edit mode for completed sessions */}
            {isEditable && (
              <Pressable
                onPress={handleDeleteExercise}
                disabled={deleteItemMutation.isPending}
                style={{ cursor: 'pointer', userSelect: 'none' } as never}
              >
                <Stack
                  width={32}
                  height={32}
                  borderRadius="$2"
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="$backgroundHover"
                  opacity={deleteItemMutation.isPending ? 0.5 : 1}
                  hoverStyle={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  pressStyle={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                >
                  {deleteItemMutation.isPending ? (
                    <ActivityIndicator size="small" color={theme.error?.val ?? '#EF4444'} />
                  ) : (
                    <MaterialCommunityIcons
                      name="close"
                      size={18}
                      color={theme.textMuted?.val ?? '#71717A'}
                    />
                  )}
                </Stack>
              </Pressable>
            )}
          </XStack>
        </XStack>

        {/* Note input (when editing) */}
        {showNoteInput && (
          <TextInput
            style={{
              height: 40,
              backgroundColor: theme.background?.val ?? '#09090B',
              borderRadius: 6,
              borderWidth: 1,
              borderColor: theme.borderColor?.val ?? '#27272A',
              paddingHorizontal: 12,
              fontSize: 14,
              color: theme.color?.val ?? '#FAFAFA',
            }}
            placeholder="Add a note..."
            placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
            value={localNote}
            onChangeText={setLocalNote}
            onBlur={handleNoteBlur}
            autoFocus={!item.note}
          />
        )}

        {/* Last session reference */}
        {lastSessionItem && (lastRef || lastSessionItem.feedback || lastSessionItem.note) && (
          <YStack
            backgroundColor="$blue5"
            paddingHorizontal="$3"
            paddingVertical="$2.5"
            borderRadius="$2"
            borderLeftWidth={3}
            borderLeftColor={
              lastSessionItem.feedback?.rating === 'up'
                ? '$primary'
                : lastSessionItem.feedback?.rating === 'done'
                  ? '$success'
                  : '$blue10'
            }
            gap="$1.5"
          >
            {/* Feedback from last session - shown FIRST as most important */}
            {lastSessionItem.feedback?.rating && (
              <XStack alignItems="center" gap="$2">
                <MaterialCommunityIcons
                  name={lastSessionItem.feedback.rating === 'done' ? 'check-circle' : 'arrow-up-circle'}
                  size={16}
                  color={lastSessionItem.feedback.rating === 'done'
                    ? (theme.success?.val ?? '#10B981')
                    : (theme.primary?.val ?? '#8B5CF6')}
                />
                <Text
                  fontSize={14}
                  color={lastSessionItem.feedback.rating === 'done' ? '$success' : '$primary'}
                  fontWeight="600"
                >
                  Last session: {lastSessionItem.feedback.rating === 'done' ? 'Done' : 'Up \u2191'}
                </Text>
              </XStack>
            )}
            {/* Sets from last session */}
            {lastRef && (
              <XStack alignItems="center" gap="$2">
                <MaterialCommunityIcons
                  name="history"
                  size={14}
                  color={theme.blue10?.val ?? '#3B82F6'}
                />
                <Text fontSize={13} color="$secondary">
                  {lastRef}
                </Text>
              </XStack>
            )}
            {/* Note from last session */}
            {lastSessionItem.note && (
              <XStack
                alignItems="flex-start"
                gap="$2"
                backgroundColor="rgba(59, 130, 246, 0.08)"
                paddingHorizontal="$2"
                paddingVertical="$1.5"
                borderRadius="$1"
              >
                <MaterialCommunityIcons
                  name="note-text-outline"
                  size={14}
                  color={theme.blue10?.val ?? '#3B82F6'}
                  style={{ marginTop: 2 }}
                />
                <Text fontSize={13} color="$secondary" fontStyle="italic" flex={1}>
                  "{lastSessionItem.note}"
                </Text>
              </XStack>
            )}
          </YStack>
        )}

        {/* Sets with inputs */}
        <YStack gap="$2">
          {localSets.map((localSet, index) => {
            const serverSet = item.sets[index];
            const lastSet = lastSessionItem?.sets[index];
            const isSaving = serverSet && savingSets.has(serverSet.id);
            const isDeleting = serverSet && deletingSets.has(serverSet.id);
            const isCopied = copiedSetIndex === index;
            const hasLastSetData = lastSet && (lastSet.weight_kg !== null || lastSet.reps !== null || lastSet.duration_sec !== null || lastSet.distance_m !== null);
            const canDeleteSet = canEdit && localSets.length > 1;

            return (
              <XStack
                key={localSet.id}
                backgroundColor={isCopied ? '$blue5' : '$backgroundHover'}
                padding="$2"
                borderRadius="$2"
                alignItems="center"
                gap="$2"
              >
                {/* Set number */}
                <Text fontSize="$2" color="$textMuted" width={36}>
                  Set {index + 1}
                </Text>

                {/* Inputs container - takes remaining space */}
                <XStack flex={1} alignItems="center" gap="$2">

                {/* Inputs based on tracking type - read-only when session is completed */}
                {trackingType === 'weight_reps' && (
                  <XStack alignItems="center" gap="$2">
                    <TextInput
                      style={{
                        width: 70,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: canEdit ? 1 : 0.6,
                      }}
                      placeholder="kg"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="decimal-pad"
                      value={localSet.weight}
                      onChangeText={(v) => handleInputChange(index, 'weight', v)}
                      onBlur={() => handleBlur(index)}
                      editable={canEdit}
                    />
                    <Text color="$textMuted" fontSize={16}>×</Text>
                    <TextInput
                      style={{
                        width: 70,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: canEdit ? 1 : 0.6,
                      }}
                      placeholder="reps"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="number-pad"
                      value={localSet.reps}
                      onChangeText={(v) => handleInputChange(index, 'reps', v)}
                      onBlur={() => handleBlur(index)}
                      editable={canEdit}
                    />
                  </XStack>
                )}
                {trackingType === 'duration' && (
                  <XStack alignItems="center" gap="$2">
                    <TextInput
                      style={{
                        width: 80,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: canEdit ? 1 : 0.6,
                      }}
                      placeholder="seconds"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="number-pad"
                      value={localSet.duration}
                      onChangeText={(v) => handleInputChange(index, 'duration', v)}
                      onBlur={() => handleBlur(index)}
                      editable={canEdit}
                    />
                    <Text fontSize={12} color="$textMuted">sec</Text>
                  </XStack>
                )}
                {trackingType === 'distance' && (
                  <XStack alignItems="center" gap="$2">
                    <TextInput
                      style={{
                        width: 60,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: canEdit ? 1 : 0.6,
                      }}
                      placeholder="0.0"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="decimal-pad"
                      value={localSet.distance}
                      onChangeText={(v) => handleInputChange(index, 'distance', v)}
                      onBlur={() => handleBlur(index)}
                      editable={canEdit}
                    />
                    <Text fontSize={12} color="$textMuted">km</Text>
                    <Text color="$textMuted" fontSize={12}>in</Text>
                    <TextInput
                      style={{
                        width: 60,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: canEdit ? 1 : 0.6,
                      }}
                      placeholder="m:ss"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="numbers-and-punctuation"
                      value={localSet.duration}
                      onChangeText={(v) => handleInputChange(index, 'duration', v)}
                      onBlur={() => handleBlur(index)}
                      editable={canEdit}
                    />
                  </XStack>
                )}
                </XStack>

                {/* Action buttons - aligned to right */}
                <XStack alignItems="center" gap="$1">
                {/* Copy button - show when editing is allowed */}
                {hasLastSetData && canEdit && (
                  <Pressable
                    onPress={() => handleCopySet(index)}
                    disabled={isSaving}
                    style={{ cursor: 'pointer', userSelect: 'none' } as never}
                  >
                    <Stack
                      backgroundColor={isCopied ? '$secondary' : '$blue5'}
                      width={32}
                      height={32}
                      borderRadius="$2"
                      alignItems="center"
                      justifyContent="center"
                      opacity={isSaving ? 0.5 : 1}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color={theme.secondary?.val} />
                      ) : (
                        <MaterialCommunityIcons
                          name="content-copy"
                          size={16}
                          color={isCopied ? '#fff' : (theme.blue10?.val ?? '#3B82F6')}
                        />
                      )}
                    </Stack>
                  </Pressable>
                )}

                {/* Saving indicator (when no copy button) */}
                {!hasLastSetData && isSaving && (
                  <ActivityIndicator size="small" color={theme.primary?.val} />
                )}

                {/* Delete set button - only show when session is in progress and more than 1 set */}
                {canDeleteSet && serverSet && (
                  <Pressable
                    onPress={() => {
                      setDeletingSets((prev) => new Set(prev).add(serverSet.id));
                      deleteSetMutation.mutate(serverSet.id, {
                        onSettled: () => {
                          setDeletingSets((prev) => {
                            const next = new Set(prev);
                            next.delete(serverSet.id);
                            return next;
                          });
                        },
                      });
                    }}
                    disabled={isDeleting || isSaving}
                    style={{ cursor: 'pointer', userSelect: 'none' } as never}
                  >
                    <Stack
                      width={32}
                      height={32}
                      borderRadius="$2"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="rgba(239, 68, 68, 0.1)"
                      opacity={isDeleting || isSaving ? 0.5 : 1}
                    >
                      {isDeleting ? (
                        <ActivityIndicator size="small" color={theme.error?.val ?? '#EF4444'} />
                      ) : (
                        <MaterialCommunityIcons
                          name="trash-can-outline"
                          size={16}
                          color={theme.error?.val ?? '#EF4444'}
                        />
                      )}
                    </Stack>
                  </Pressable>
                )}
                </XStack>
              </XStack>
            );
          })}
        </YStack>

        {/* Add set button - only show when editing is allowed */}
        {canEdit && (
          <Button
            variant="ghost"
            size="small"
            loading={addSetMutation.isPending}
            onPress={() => addSetMutation.mutate()}
          >
            + Add Set
          </Button>
        )}

        {/* Feedback buttons */}
        <YStack gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$2" color="$textMuted">
              How did it go?
            </Text>
            {/* Show last session's feedback */}
            {lastSessionItem?.feedback?.rating && (
              <Text fontSize={11} color="$textMuted">
                Last time: {lastSessionItem.feedback.rating}
              </Text>
            )}
          </XStack>
          <XStack gap="$2">
            {(['done', 'up'] as FeedbackRating[]).map((rating) => {
              const isServerSelected = item.feedback?.rating === rating;
              const isPendingThis = feedbackMutation.isPending && feedbackMutation.variables === rating;
              // Show selected state if server says selected OR if we're currently saving this rating
              const isSelected = isServerSelected || isPendingThis;
              // Check if this was selected last session
              const wasLastSession = lastSessionItem?.feedback?.rating === rating;
              const colors = {
                done: { bg: 'rgba(16, 185, 129, 0.15)', activeBg: '$success' },
                up: { bg: '$purple5', activeBg: '$primary' },
              };
              const colorConfig = colors[rating];
              const labels = {
                done: 'Done',
                up: 'Up ↑',
              };

              return (
                <Pressable
                  key={rating}
                  onPress={() => feedbackMutation.mutate(rating)}
                  disabled={feedbackMutation.isPending || !canEdit}
                  style={{
                    flex: 1,
                    cursor: canEdit ? 'pointer' : 'default',
                    userSelect: 'none',
                    opacity: !canEdit ? 0.7 : (feedbackMutation.isPending && !isPendingThis ? 0.5 : 1),
                  } as never}
                >
                  <Stack
                    backgroundColor={isSelected ? colorConfig.activeBg : colorConfig.bg}
                    paddingVertical="$2.5"
                    paddingHorizontal="$3"
                    borderRadius="$2"
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={wasLastSession && !isSelected ? 1 : 0}
                    borderColor={wasLastSession ? colorConfig.activeBg : 'transparent'}
                  >
                    <Text
                      fontSize={13}
                      fontWeight="600"
                      color={isSelected ? 'white' : getFeedbackColor(rating)}
                    >
                      {labels[rating]}
                    </Text>
                  </Stack>
                </Pressable>
              );
            })}
          </XStack>
        </YStack>
      </YStack>
    </Card>
  );
}
