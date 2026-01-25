import React, { useState, useCallback } from 'react';
import { Pressable } from 'react-native';
import { YStack, XStack, Stack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSet,
  createSets,
  setFeedback,
  formatWeight,
  formatChange,
  formatDuration,
  type ItemWithSets,
  type ItemProgressComparison,
  type FeedbackRating,
  type ItemSetInsert,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { handleError } from '../utils';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';

interface ItemCardProps {
  item: ItemWithSets;
  comparison: ItemProgressComparison | null;
  entryId: string;
  lastSessionItem?: ItemWithSets | null;
}

export function ItemCard({ item, comparison, entryId, lastSessionItem }: ItemCardProps): React.ReactElement {
  const { user } = useSupabaseContext();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const [showAddSet, setShowAddSet] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  // Format last session's sets as reference text
  const formatLastSessionRef = useCallback((): string | null => {
    if (!lastSessionItem || lastSessionItem.sets.length === 0) return null;

    const trackingType = (item as ItemWithSets & { tracking_type?: string }).tracking_type ?? 'weight_reps';

    if (trackingType === 'duration') {
      // Duration tracking - show total or individual durations
      const durations = lastSessionItem.sets
        .filter(s => s.duration_sec !== null)
        .map(s => formatDuration(s.duration_sec!));
      return durations.length > 0 ? durations.join(' · ') : null;
    }

    // Weight/reps tracking - show each set
    const setStrings = lastSessionItem.sets
      .filter(s => s.weight_kg !== null || s.reps !== null)
      .map(s => {
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
  }, [lastSessionItem, item]);

  const lastRef = formatLastSessionRef();

  const addSetMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const result = await createSet({
        item_id: item.id,
        user_id: user.id,
        set_index: item.sets.length,
        weight_kg: weight ? parseFloat(weight) : null,
        reps: reps ? parseInt(reps, 10) : null,
      });

      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
      setWeight('');
      setReps('');
      setShowAddSet(false);
    },
    onError: (error) => handleError(error),
  });

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
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => handleError(error),
  });

  // Copy all sets from last session
  const copyFromLastMutation = useMutation({
    mutationFn: async () => {
      if (!user || !lastSessionItem) throw new Error('No data to copy');

      const setsToCreate: Omit<ItemSetInsert, 'item_id' | 'user_id'>[] = lastSessionItem.sets.map((lastSet, index) => ({
        set_index: item.sets.length + index,
        weight_kg: lastSet.weight_kg,
        reps: lastSet.reps,
        duration_sec: lastSet.duration_sec,
        distance_m: lastSet.distance_m,
      }));

      const result = await createSets(item.id, user.id, setsToCreate);
      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
    },
    onError: (error) => handleError(error),
  });

  const getFeedbackColor = (rating: FeedbackRating): string => {
    switch (rating) {
      case 'success': return '$success';
      case 'hard': return '$warning';
      case 'fail': return '$error';
    }
  };

  return (
    <Card>
      <YStack gap="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {item.name}
          </Text>
          {comparison && comparison.volumeChange !== 0 && (
            <Text
              fontSize="$2"
              color={comparison.volumeChange > 0 ? '$success' : '$error'}
            >
              {formatChange(comparison.volumeChange, ' kg vol')}
            </Text>
          )}
        </XStack>

        {/* Last session reference */}
        {lastRef && (
          <XStack
            backgroundColor="rgba(139, 92, 246, 0.08)"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$2"
            alignItems="center"
            justifyContent="space-between"
          >
            <XStack alignItems="center" gap="$2" flex={1}>
              <MaterialCommunityIcons
                name="history"
                size={14}
                color={theme.textMuted?.val ?? '#666'}
              />
              <Text fontSize={13} color="$textMuted" numberOfLines={1} flex={1}>
                Last: {lastRef}
              </Text>
            </XStack>
            {lastSessionItem && lastSessionItem.sets.length > 0 && (
              <Pressable
                onPress={() => copyFromLastMutation.mutate()}
                disabled={copyFromLastMutation.isPending}
              >
                <Stack
                  backgroundColor="rgba(139, 92, 246, 0.15)"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  opacity={copyFromLastMutation.isPending ? 0.5 : 1}
                >
                  <XStack alignItems="center" gap="$1">
                    <MaterialCommunityIcons
                      name="content-copy"
                      size={12}
                      color={theme.purple10?.val ?? '#8B5CF6'}
                    />
                    <Text fontSize={11} fontWeight="600" color="$purple10">
                      Copy
                    </Text>
                  </XStack>
                </Stack>
              </Pressable>
            )}
          </XStack>
        )}

        {/* Sets */}
        {item.sets.length > 0 && (
          <YStack gap="$2">
            {item.sets.map((set, index) => {
              const hasActualWeight = set.weight_kg !== null;
              const hasActualReps = set.reps !== null;
              const hasActualDuration = set.duration_sec !== null;
              const hasTargetReps = set.target_reps !== null;
              const hasTargetDuration = set.target_duration_sec !== null;
              const showTargetHint = !hasActualReps && !hasActualDuration && (hasTargetReps || hasTargetDuration);

              return (
                <XStack
                  key={set.id}
                  backgroundColor="$backgroundHover"
                  padding="$2"
                  borderRadius="$2"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Text fontSize="$2" color="$textMuted">
                    Set {index + 1}
                  </Text>
                  <XStack gap="$3" alignItems="center">
                    {hasActualWeight && (
                      <Text fontSize="$3" color="$color">
                        {formatWeight(set.weight_kg!)}
                      </Text>
                    )}
                    {hasActualReps && (
                      <Text fontSize="$3" color="$color">
                        {set.reps} reps
                      </Text>
                    )}
                    {hasActualDuration && (
                      <Text fontSize="$3" color="$color">
                        {formatDuration(set.duration_sec!)}
                      </Text>
                    )}
                    {showTargetHint && (
                      <Text fontSize="$2" color="$textMuted" fontStyle="italic">
                        {hasTargetReps ? `Target: ${set.target_reps} reps` : `Target: ${formatDuration(set.target_duration_sec!)}`}
                      </Text>
                    )}
                    {!hasActualWeight && !hasActualReps && !hasActualDuration && !showTargetHint && (
                      <Text fontSize="$2" color="$textMuted" fontStyle="italic">
                        Not recorded
                      </Text>
                    )}
                  </XStack>
                </XStack>
              );
            })}
          </YStack>
        )}

        {/* Add set form */}
        {showAddSet ? (
          <YStack gap="$2" backgroundColor="$backgroundHover" padding="$3" borderRadius="$3">
            <XStack gap="$2">
              <YStack flex={1}>
                <Input
                  placeholder="Weight (kg)"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </YStack>
              <YStack flex={1}>
                <Input
                  placeholder="Reps"
                  keyboardType="number-pad"
                  value={reps}
                  onChangeText={setReps}
                />
              </YStack>
            </XStack>
            <XStack gap="$2">
              <Button
                flex={1}
                variant="secondary"
                size="small"
                onPress={() => setShowAddSet(false)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                variant="primary"
                size="small"
                loading={addSetMutation.isPending}
                onPress={() => addSetMutation.mutate(undefined)}
              >
                Add Set
              </Button>
            </XStack>
          </YStack>
        ) : (
          <Button
            variant="secondary"
            size="small"
            onPress={() => setShowAddSet(true)}
          >
            + Add Set
          </Button>
        )}

        {/* Feedback buttons */}
        <YStack gap="$2">
          <Text fontSize="$2" color="$textMuted">
            How did it go?
          </Text>
          <XStack gap="$2">
            {(['success', 'hard', 'fail'] as FeedbackRating[]).map((rating) => (
              <Button
                key={rating}
                flex={1}
                size="small"
                variant={item.feedback?.rating === rating ? 'primary' : 'secondary'}
                backgroundColor={
                  item.feedback?.rating === rating ? getFeedbackColor(rating) : undefined
                }
                onPress={() => feedbackMutation.mutate(rating)}
              >
                {rating.charAt(0).toUpperCase() + rating.slice(1)}
              </Button>
            ))}
          </XStack>
        </YStack>
      </YStack>
    </Card>
  );
}
