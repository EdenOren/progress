import React, { useState } from 'react';
import { ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate } from '@progress/shared';
import type { ItemWithSets } from '@progress/shared';
import { Card, Button, LoadingScreen, EmptyState, ExerciseInputCard } from '../../src/components';
import { AddItemModal } from '../../src/components/AddItemModal';
import {
  useEntryWithItems,
  useLastEntry,
  useCompleteEntry,
  useDeleteEntry,
} from '../../src/hooks';
import { showSuccessToast } from '../../src/utils';

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
  const [showAddItem, setShowAddItem] = useState(false);
  const [showComparisonHint, setShowComparisonHint] = useState(true);
  const theme = useTheme();

  const handleComplete = (): void => {
    if (!entryId || completeEntry.isPending) return;
    completeEntry.mutate(entryId, {
      onSuccess: () => {
        showSuccessToast('Session completed!');
        router.replace('/');
      },
    });
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
          headerRight: () => deleteEntry.isPending ? (
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
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
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
                    backgroundColor="rgba(245, 158, 11, 0.15)"
                    paddingHorizontal={12}
                    paddingVertical={6}
                    borderRadius={9999}
                  >
                    <Text fontSize={13} color="$warning" fontWeight="600">
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
              <Card backgroundColor="$blue5">
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap={8} flex={1}>
                    <MaterialCommunityIcons
                      name="history"
                      size={16}
                      color={theme.secondary?.val ?? '#3B82F6'}
                    />
                    <Text fontSize={13} color="$secondary" flex={1}>
                      {showComparisonHint
                        ? `Comparing with ${formatDate(lastEntry.performed_at)}`
                        : 'Tap to show last session comparison'}
                    </Text>
                  </XStack>
                  <MaterialCommunityIcons
                    name={showComparisonHint ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.secondary?.val ?? '#3B82F6'}
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
              entry.items.map((item) => (
                <ExerciseInputCard
                  key={item.id}
                  item={item}
                  entryId={entry.id}
                  lastSessionItem={showComparisonHint ? getLastSessionItem(item) : null}
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

        {/* Bottom actions */}
        {!entry.is_completed && (
          <Stack
            position="absolute"
            bottom={24}
            right={24}
            backgroundColor="$primary"
            borderRadius={9999}
            paddingHorizontal={24}
            height={52}
            alignItems="center"
            justifyContent="center"
            opacity={completeEntry.isPending ? 0.7 : 1}
            cursor={completeEntry.isPending ? 'not-allowed' : 'pointer'}
            pressStyle={{
              scale: 0.94,
              backgroundColor: '$primaryDark',
            }}
            onPress={handleComplete}
          >
            {completeEntry.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text color="white" fontWeight="600" fontSize={15}>
                Complete Session
              </Text>
            )}
          </Stack>
        )}

        <AddItemModal
          visible={showAddItem}
          onClose={() => setShowAddItem(false)}
          entryId={entry.id}
          subjectId={entry.subject_id}
        />
      </SafeAreaView>
    </>
  );
}
