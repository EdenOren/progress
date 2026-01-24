import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, formatRelativeDate, getTodayISO } from '@progress/shared';
import type { Entry } from '@progress/shared';
import { Card, Button, EmptyState, LoadingScreen } from '../../src/components';
import { useSubject, useEntries, useCreateEntry } from '../../src/hooks';

export default function SubjectDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: subjectLoading } = useSubject(id);
  const { data: entries, isLoading: entriesLoading, refetch, isRefetching } = useEntries(id);
  const createEntry = useCreateEntry();

  const handleStartEntry = async (): Promise<void> => {
    if (!id) return;

    try {
      const entry = await createEntry.mutateAsync({
        subject_id: id,
        performed_at: getTodayISO(),
      });

      router.push({
        pathname: '/entry/[id]',
        params: { id: entry.id },
      });
    } catch (e) {
      // Error handled by mutation
    }
  };

  const handleEntryPress = (entry: Entry): void => {
    router.push({
      pathname: '/entry/[id]',
      params: { id: entry.id },
    });
  };

  const renderEntry = ({ item }: { item: Entry }): React.ReactElement => (
    <Card
      pressable
      onPress={() => handleEntryPress(item)}
      style={{ marginHorizontal: 16, marginBottom: 12 }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <YStack gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            {formatDate(item.performed_at)}
          </Text>
          <Text fontSize="$2" color="$placeholderColor">
            {formatRelativeDate(item.performed_at)}
          </Text>
        </YStack>
        <XStack alignItems="center" gap="$2">
          {item.is_completed ? (
            <YStack
              backgroundColor="$success"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
            >
              <Text fontSize="$1" color="white" fontWeight="600">
                Completed
              </Text>
            </YStack>
          ) : (
            <YStack
              backgroundColor="$warning"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
            >
              <Text fontSize="$1" color="white" fontWeight="600">
                In Progress
              </Text>
            </YStack>
          )}
        </XStack>
      </XStack>
      {item.notes && (
        <Text fontSize="$2" color="$placeholderColor" marginTop="$2" numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </Card>
  );

  if (subjectLoading || entriesLoading) {
    return <LoadingScreen />;
  }

  if (!subject) {
    return (
      <EmptyState
        title="Not Found"
        message="This workout could not be found"
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: subject.name,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <YStack flex={1}>
          {subject.description && (
            <YStack padding="$4" paddingBottom="$2">
              <Text fontSize="$3" color="$placeholderColor">
                {subject.description}
              </Text>
            </YStack>
          )}

          <FlatList
            data={entries ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 8,
              paddingBottom: 100,
            }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No entries yet"
                message="Start your first session to begin tracking"
                actionLabel="Start Session"
                onAction={handleStartEntry}
              />
            }
          />

          {(entries?.length ?? 0) > 0 && (
            <YStack
              position="absolute"
              bottom={20}
              left={0}
              right={0}
              paddingHorizontal="$4"
            >
              <Button
                variant="primary"
                fullWidth
                size="large"
                loading={createEntry.isPending}
                onPress={handleStartEntry}
              >
                Start Today's Session
              </Button>
            </YStack>
          )}
        </YStack>
      </SafeAreaView>
    </>
  );
}
