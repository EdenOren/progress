import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, formatRelativeDate, getTodayISO } from '@progress/shared';
import type { Entry } from '@progress/shared';
import { Card, EmptyState, LoadingScreen } from '../../src/components';
import { useSubject, useEntries, useCreateEntry } from '../../src/hooks';

export default function SubjectDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: subjectLoading } = useSubject(id);
  const { data: entries, isLoading: entriesLoading, refetch, isRefetching } = useEntries(id);
  const createEntry = useCreateEntry();
  const theme = useTheme();

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
    <Stack marginHorizontal={16} marginBottom={12}>
      <Card pressable onPress={() => handleEntryPress(item)}>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap={4}>
            <Text fontSize={16} fontWeight="600" color="$color">
              {formatDate(item.performed_at)}
            </Text>
            <Text fontSize={14} color="$textMuted">
              {formatRelativeDate(item.performed_at)}
            </Text>
          </YStack>
          {item.is_completed ? (
            <Stack
              backgroundColor="rgba(16, 185, 129, 0.15)"
              paddingHorizontal={10}
              paddingVertical={4}
              borderRadius={9999}
            >
              <Text fontSize={12} fontWeight="600" color="$success">
                Completed
              </Text>
            </Stack>
          ) : (
            <Stack
              backgroundColor="rgba(245, 158, 11, 0.15)"
              paddingHorizontal={10}
              paddingVertical={4}
              borderRadius={9999}
            >
              <Text fontSize={12} fontWeight="600" color="$warning">
                In Progress
              </Text>
            </Stack>
          )}
        </XStack>
        {item.notes && (
          <Text fontSize={14} color="$textSecondary" marginTop={8} numberOfLines={2} fontStyle="italic">
            {item.notes}
          </Text>
        )}
      </Card>
    </Stack>
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
      <RouterStack.Screen
        options={{
          title: subject.name,
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
        <YStack flex={1}>
          {subject.description && (
            <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={8}>
              <Text fontSize={14} color="$textSecondary">
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
              onPress={handleStartEntry}
            >
              <Text color="white" fontWeight="600" fontSize={15}>
                + Start Session
              </Text>
            </Stack>
          )}
        </YStack>
      </SafeAreaView>
    </>
  );
}
