import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
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
  const theme = useTheme();

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
      <RouterStack.Screen
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

          {/* Last time comparison hint */}
          {lastEntry && (
            <Stack marginBottom={16}>
              <Card>
                <Text fontSize={13} color="$textSecondary">
                  Comparing with your session from {formatDate(lastEntry.performed_at)}
                </Text>
              </Card>
            </Stack>
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
            pressStyle={{
              scale: 0.94,
              backgroundColor: '$primaryDark',
            }}
            onPress={handleComplete}
          >
            <Text color="white" fontWeight="600" fontSize={15}>
              Complete Session
            </Text>
          </Stack>
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
