import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  type ItemWithSets,
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
  isCollapsed?: boolean;
  onExpand?: () => void;
  onFeedbackSelected?: (itemId: string) => void;
}

interface LocalSetState {
  id: string;
  weight: string;
  reps: string;
  duration: string;
  isDirty: boolean;
}

export function ExerciseInputCard({
  item,
  entryId,
  lastSessionItem,
  isSessionInProgress = false,
  isCollapsed = false,
  onExpand,
  onFeedbackSelected,
}: ExerciseInputCardProps): React.ReactElement {
  const { user } = useSupabaseContext();
  const queryClient = useQueryClient();
  const theme = useTheme();

  const trackingType = (item as ItemWithSets & { tracking_type?: string }).tracking_type ?? 'weight_reps';

  // Local state for set inputs - allows typing without lag
  const [localSets, setLocalSets] = useState<LocalSetState[]>(() =>
    item.sets.map((set) => ({
      id: set.id,
      weight: set.weight_kg?.toString() ?? '',
      reps: set.reps?.toString() ?? '',
      duration: set.duration_sec?.toString() ?? '',
      isDirty: false,
    }))
  );

  // Track which sets are currently being saved or deleted
  const [savingSets, setSavingSets] = useState<Set<string>>(new Set());
  const [deletingSets, setDeletingSets] = useState<Set<string>>(new Set());
  const [copiedSetIndex, setCopiedSetIndex] = useState<number | null>(null);

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
        duration: set.duration_sec?.toString() ?? '',
        isDirty: false,
      }))
    );
  }, [item.sets]);

  // Sync note state when item.note changes from server
  useEffect(() => {
    setLocalNote(item.note ?? '');
  }, [item.note]);

  // Update item mutation (for notes)
  const updateItemMutation = useUpdateItem(entryId);

  // Delete item mutation (for removing exercise from entry)
  const deleteItemMutation = useDeleteItem(entryId);

  // Format last session's sets as reference text
  const formatLastSessionRef = useCallback((): string | null => {
    if (!lastSessionItem || lastSessionItem.sets.length === 0) return null;

    if (trackingType === 'duration') {
      const durations = lastSessionItem.sets
        .filter((s) => s.duration_sec !== null)
        .map((s) => formatDuration(s.duration_sec!));
      return durations.length > 0 ? durations.join(' · ') : null;
    }

    const setStrings = lastSessionItem.sets
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
  }, [lastSessionItem, trackingType]);

  const lastRef = formatLastSessionRef();

  // Update set mutation (auto-save on blur)
  const updateSetMutation = useMutation({
    mutationFn: async ({
      setId,
      weight_kg,
      reps,
      duration_sec,
    }: {
      setId: string;
      weight_kg: number | null;
      reps: number | null;
      duration_sec: number | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await updateSet(user.id, setId, {
        weight_kg,
        reps,
        duration_sec,
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
    onSuccess: () => {
      // Notify parent FIRST (before query invalidation) to update accordion state
      onFeedbackSelected?.(item.id);
      // Then refetch data
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => handleError(error),
  });

  // Handle input change (just updates local state)
  const handleInputChange = (
    setIndex: number,
    field: 'weight' | 'reps' | 'duration',
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
    const duration_sec = localSet.duration ? parseInt(localSet.duration, 10) : null;

    // Check if values actually changed
    const weightChanged = weight_kg !== serverSet.weight_kg;
    const repsChanged = reps !== serverSet.reps;
    const durationChanged = duration_sec !== serverSet.duration_sec;

    if (!weightChanged && !repsChanged && !durationChanged) {
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
              duration: lastSet.duration_sec?.toString() ?? '',
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
    const completedSets = item.sets.filter(s => (s.weight_kg !== null || s.duration_sec !== null)).length;
    const totalSets = item.sets.length;
    const hasFeedback = item.feedback?.rating;

    return (
      <Pressable
        onPress={onExpand}
        disabled={!isSessionInProgress}
        style={{ cursor: isSessionInProgress ? 'pointer' : 'default', userSelect: 'none' } as never}
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
                  ? (item.feedback!.rating === 'done' ? 'rgba(16, 185, 129, 0.15)' : '$purple5')
                  : '$backgroundHover'
              }
              alignItems="center"
              justifyContent="center"
            >
              <MaterialCommunityIcons
                name={hasFeedback ? getFeedbackIcon(item.feedback!.rating) : 'dumbbell'}
                size={18}
                color={
                  hasFeedback
                    ? getFeedbackThemeColor(item.feedback!.rating)
                    : (theme.textMuted?.val ?? '#71717A')
                }
              />
            </Stack>

            {/* Exercise name and summary */}
            <YStack flex={1}>
              <Text fontSize={14} fontWeight="600" color="$color">
                {item.name}
              </Text>
              <XStack alignItems="center" gap="$2">
                {hasFeedback ? (
                  <>
                    <Text fontSize={12} color="$textMuted">
                      {completedSets}/{totalSets} sets · {item.feedback!.rating}
                    </Text>
                    {lastSessionItem?.feedback?.rating && (
                      <Text fontSize={11} color="$textMuted">
                        (prev: {lastSessionItem.feedback.rating})
                      </Text>
                    )}
                  </>
                ) : (
                  <Text fontSize={12} color="$primary">
                    {isSessionInProgress ? 'Tap to start' : `${totalSets} sets`}
                  </Text>
                )}
              </XStack>
            </YStack>

            {/* Chevron indicator for expandable items */}
            {isSessionInProgress && !hasFeedback && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.textMuted?.val ?? '#71717A'}
              />
            )}
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

            {/* Delete exercise button - hidden during in-progress session */}
            {!isSessionInProgress && (
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
        {lastRef && (
          <XStack
            backgroundColor="$blue5"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$2"
            alignItems="center"
          >
            <MaterialCommunityIcons
              name="history"
              size={14}
              color={theme.blue10?.val ?? '#3B82F6'}
            />
            <Text fontSize={13} color="$secondary" marginLeft="$2">
              Last: {lastRef}
            </Text>
          </XStack>
        )}

        {/* Sets with inputs */}
        <YStack gap="$2">
          {localSets.map((localSet, index) => {
            const serverSet = item.sets[index];
            const lastSet = lastSessionItem?.sets[index];
            const isSaving = serverSet && savingSets.has(serverSet.id);
            const isDeleting = serverSet && deletingSets.has(serverSet.id);
            const isCopied = copiedSetIndex === index;
            const hasLastSetData = lastSet && (lastSet.weight_kg !== null || lastSet.reps !== null || lastSet.duration_sec !== null);
            const canDeleteSet = isSessionInProgress && localSets.length > 1;

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
                <Text fontSize="$2" color="$textMuted" width={40}>
                  Set {index + 1}
                </Text>

                {/* Inputs based on tracking type - read-only when session is completed */}
                {trackingType === 'weight_reps' ? (
                  <XStack flex={1} alignItems="center" gap="$2" minWidth={0}>
                    <TextInput
                      style={{
                        flex: 1,
                        minWidth: 50,
                        maxWidth: 80,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: isSessionInProgress ? 1 : 0.6,
                      }}
                      placeholder="kg"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="decimal-pad"
                      value={localSet.weight}
                      onChangeText={(v) => handleInputChange(index, 'weight', v)}
                      onBlur={() => handleBlur(index)}
                      editable={isSessionInProgress}
                    />
                    <Text color="$textMuted" fontSize={16}>×</Text>
                    <TextInput
                      style={{
                        flex: 1,
                        minWidth: 50,
                        maxWidth: 80,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: isSessionInProgress ? 1 : 0.6,
                      }}
                      placeholder="reps"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="number-pad"
                      value={localSet.reps}
                      onChangeText={(v) => handleInputChange(index, 'reps', v)}
                      onBlur={() => handleBlur(index)}
                      editable={isSessionInProgress}
                    />
                  </XStack>
                ) : (
                  // Duration input
                  <XStack flex={1} alignItems="center" gap="$2" minWidth={0}>
                    <TextInput
                      style={{
                        flex: 1,
                        minWidth: 60,
                        maxWidth: 100,
                        height: 36,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: theme.borderColor?.val ?? '#27272A',
                        paddingHorizontal: 8,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                        textAlign: 'center',
                        opacity: isSessionInProgress ? 1 : 0.6,
                      }}
                      placeholder="seconds"
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      keyboardType="number-pad"
                      value={localSet.duration}
                      onChangeText={(v) => handleInputChange(index, 'duration', v)}
                      onBlur={() => handleBlur(index)}
                      editable={isSessionInProgress}
                    />
                    <Text fontSize={12} color="$textMuted">sec</Text>
                  </XStack>
                )}

                {/* Copy button - only show when session is in progress */}
                {hasLastSetData && isSessionInProgress && (
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
            );
          })}
        </YStack>

        {/* Add set button - only show when session is in progress */}
        {isSessionInProgress && (
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
                  disabled={feedbackMutation.isPending || !isSessionInProgress}
                  style={{
                    flex: 1,
                    cursor: isSessionInProgress ? 'pointer' : 'default',
                    userSelect: 'none',
                    opacity: !isSessionInProgress ? 0.7 : (feedbackMutation.isPending && !isPendingThis ? 0.5 : 1),
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
