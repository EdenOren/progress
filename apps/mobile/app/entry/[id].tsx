import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, compareItemProgress } from '@progress/shared';
import type { ItemWithSets } from '@progress/shared';
import { Card, Button, LoadingScreen, EmptyState } from '../../src/components';
import { ItemCard } from '../../src/components/ItemCard';
import { AddItemModal } from '../../src/components/AddItemModal';
import {
  useEntryWithItems,
  useLastEntry,
  useCompleteEntry,
  useDeleteEntry,
} from '../../src/hooks';

export default function EntryScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useEntryWithItems(id);
  const { data: lastEntry } = useLastEntry(
    entry?.subject_id ?? '',
    entry?.performed_at
  );
  const completeEntry = useCompleteEntry();
  const deleteEntry = useDeleteEntry();
  const [showAddItem, setShowAddItem] = useState(false);

  const handleComplete = async (): Promise<void> => {
    if (!id) return;

    Alert.alert(
      'Complete Session',
      'Mark this session as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            await completeEntry.mutateAsync(id);
          },
        },
      ]
    );
  };

  const handleDelete = (): void => {
    if (!entry) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry.mutateAsync({
              entryId: entry.id,
              subjectId: entry.subject_id,
            });
            router.back();
          },
        },
      ]
    );
  };

  // Get comparison data for items
  const getItemComparison = (item: ItemWithSets) => {
    if (!lastEntry) return null;
    const comparisons = compareItemProgress([item], lastEntry.items);
    return comparisons.find(
      (c) => c.itemName.toLowerCase() === item.name.toLowerCase()
    ) ?? null;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!entry) {
    return (
      <EmptyState
        title="Not Found"
        message="This entry could not be found"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: formatDate(entry.performed_at),
          headerBackTitle: 'Back',
          headerRight: () => (
            <Button variant="ghost" size="small" onPress={handleDelete}>
              Delete
            </Button>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        >
          {/* Status */}
          <Card style={{ marginBottom: 16 }}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$placeholderColor">
                Status
              </Text>
              {entry.is_completed ? (
                <YStack
                  backgroundColor="$success"
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="white" fontWeight="600">
                    Completed
                  </Text>
                </YStack>
              ) : (
                <YStack
                  backgroundColor="$warning"
                  paddingHorizontal="$3"
                  paddingVertical="$1.5"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="white" fontWeight="600">
                    In Progress
                  </Text>
                </YStack>
              )}
            </XStack>
          </Card>

          {/* Last time comparison hint */}
          {lastEntry && (
            <Card style={{ marginBottom: 16, backgroundColor: '#1f2937' }}>
              <Text fontSize="$2" color="$placeholderColor">
                Comparing with your session from {formatDate(lastEntry.performed_at)}
              </Text>
            </Card>
          )}

          {/* Items list */}
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="600" color="$color">
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
                <YStack alignItems="center" padding="$4" gap="$2">
                  <Text color="$placeholderColor" textAlign="center">
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
                <ItemCard
                  key={item.id}
                  item={item}
                  comparison={getItemComparison(item)}
                  entryId={entry.id}
                />
              ))
            )}
          </YStack>

          {/* Notes */}
          {entry.notes && (
            <Card style={{ marginTop: 16 }}>
              <YStack gap="$2">
                <Text fontSize="$3" fontWeight="600" color="$color">
                  Notes
                </Text>
                <Text fontSize="$3" color="$placeholderColor">
                  {entry.notes}
                </Text>
              </YStack>
            </Card>
          )}
        </ScrollView>

        {/* Bottom actions */}
        {!entry.is_completed && (
          <YStack
            position="absolute"
            bottom={20}
            left={0}
            right={0}
            paddingHorizontal="$4"
            gap="$2"
          >
            <Button
              variant="primary"
              fullWidth
              size="large"
              loading={completeEntry.isPending}
              onPress={handleComplete}
            >
              Complete Session
            </Button>
          </YStack>
        )}

        <AddItemModal
          visible={showAddItem}
          onClose={() => setShowAddItem(false)}
          entryId={entry.id}
        />
      </SafeAreaView>
    </>
  );
}
