import React, { useCallback } from 'react';
import { FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, formatRelativeDate, getTodayISO } from '@progress/shared';
import type { Entry } from '@progress/shared';
import { Card, EmptyState, LoadingScreen, TemplateSection } from '../../../src/components';
import { useSubject, useEntries, useCreateEntry, useCreateEntryWithTemplate, useWorkoutTemplate, useDeleteEntry } from '../../../src/hooks';
import { showSuccessToast } from '../../../src/utils';

export default function SubjectDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: subjectLoading } = useSubject(id);
  const { data: entries, isLoading: entriesLoading, refetch, isRefetching } = useEntries(id);
  const { data: template } = useWorkoutTemplate(id);
  const createEntry = useCreateEntry();
  const createEntryWithTemplate = useCreateEntryWithTemplate();
  const deleteEntry = useDeleteEntry();
  const theme = useTheme();

  const isCreatingEntry = createEntry.isPending || createEntryWithTemplate.isPending;
  const hasExercises = (template?.length ?? 0) > 0;

  // Check if there's an in-progress session for this workout
  const inProgressEntry = entries?.find(entry => !entry.is_completed);
  const hasInProgressSession = !!inProgressEntry;

  const handleStartEntry = async (): Promise<void> => {
    if (!id || isCreatingEntry || !hasExercises) return;

    try {
      const templateItems = template!.map((item) => ({
        exercise_id: item.exercise_id,
        name: item.exercise.name,
        tracking_type: item.exercise.tracking_type,
        default_sets: item.default_sets,
      }));

      const entry = await createEntryWithTemplate.mutateAsync({
        input: {
          subject_id: id,
          performed_at: getTodayISO(),
        },
        templateItems,
      });

      router.push({
        pathname: '/entry/[id]',
        params: { id: entry.id },
      });
    } catch {
      // Error shown by mutation's onError handler
    }
  };

  const handleEntryPress = (entry: Entry): void => {
    router.push({
      pathname: '/entry/[id]',
      params: { id: entry.id },
    });
  };

  const handleDeleteEntry = useCallback((entry: Entry): void => {
    if (deleteEntry.isPending) return;
    deleteEntry.mutate(
      { entryId: entry.id, subjectId: id },
      {
        onSuccess: () => showSuccessToast('Session deleted successfully'),
      }
    );
  }, [deleteEntry, id]);

  const renderEntry = ({ item }: { item: Entry }): React.ReactElement => (
    <Stack marginHorizontal={16} marginBottom={12}>
      <Card pressable onPress={() => handleEntryPress(item)}>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack gap={4} flex={1}>
            <Text fontSize={16} fontWeight="600" color="$color">
              {formatDate(item.performed_at)}
            </Text>
            <Text fontSize={14} color="$textMuted">
              {formatRelativeDate(item.performed_at)}
            </Text>
          </YStack>
          <XStack alignItems="center" gap={8}>
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
                backgroundColor="$purple5"
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={9999}
              >
                <Text fontSize={12} fontWeight="600" color="$primary">
                  In Progress
                </Text>
              </Stack>
            )}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteEntry(item);
              }}
              style={{ padding: 4, cursor: 'pointer', userSelect: 'none' } as never}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Stack
                width={28}
                height={28}
                borderRadius={14}
                backgroundColor="rgba(239, 68, 68, 0.1)"
                alignItems="center"
                justifyContent="center"
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={16}
                  color={theme.error?.val ?? '#EF4444'}
                />
              </Stack>
            </Pressable>
          </XStack>
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

          {/* Template Section */}
          <YStack paddingTop={8} paddingBottom={16} borderBottomWidth={1} borderBottomColor="$borderColor">
            <TemplateSection subjectId={id} hasInProgressSession={hasInProgressSession} defaultSets={subject.default_sets} />
          </YStack>

          {/* Sessions Header */}
          <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={8}>
            <Text fontSize={13} fontWeight="600" color="$textMuted">
              Sessions ({entries?.length ?? 0})
            </Text>
          </YStack>

          <FlatList
            data={entries ?? []}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: 8,
              paddingBottom: 120,
            }}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            ListEmptyComponent={
              <EmptyState
                title="No sessions yet"
                message="Add exercises above, then start your first session"
              />
            }
          />

          {/* FAB - Start Session or Continue */}
          {hasExercises && (
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
              opacity={isCreatingEntry ? 0.7 : 1}
              cursor={isCreatingEntry ? 'not-allowed' : 'pointer'}
              pressStyle={{
                scale: 0.94,
                backgroundColor: '$primaryDark',
              }}
              onPress={hasInProgressSession ? () => handleEntryPress(inProgressEntry!) : handleStartEntry}
            >
              {isCreatingEntry ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text color="white" fontWeight="600" fontSize={15}>
                  {hasInProgressSession ? 'Continue Session' : '+ Start Session'}
                </Text>
              )}
            </Stack>
          )}
        </YStack>
      </SafeAreaView>
    </>
  );
}
