import React, { useState } from 'react';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSet,
  setFeedback,
  formatWeight,
  formatChange,
  type ItemWithSets,
  type ItemProgressComparison,
  type FeedbackRating,
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
}

export function ItemCard({ item, comparison, entryId }: ItemCardProps): React.ReactElement {
  const { user } = useSupabaseContext();
  const queryClient = useQueryClient();
  const [showAddSet, setShowAddSet] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

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

        {/* Sets */}
        {item.sets.length > 0 && (
          <YStack gap="$2">
            {item.sets.map((set, index) => (
              <XStack
                key={set.id}
                backgroundColor="$backgroundHover"
                padding="$2"
                borderRadius="$2"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontSize="$2" color="$placeholderColor">
                  Set {index + 1}
                </Text>
                <XStack gap="$3">
                  {set.weight_kg !== null && (
                    <Text fontSize="$3" color="$color">
                      {formatWeight(set.weight_kg)}
                    </Text>
                  )}
                  {set.reps !== null && (
                    <Text fontSize="$3" color="$color">
                      {set.reps} reps
                    </Text>
                  )}
                </XStack>
              </XStack>
            ))}
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
          <Text fontSize="$2" color="$placeholderColor">
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
