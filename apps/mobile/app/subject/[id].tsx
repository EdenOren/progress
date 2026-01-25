import React, { useCallback } from 'react';
import { FlatList, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, formatRelativeDate, getTodayISO } from '@progress/shared';
import type { Entry } from '@progress/shared';
import { Card, EmptyState, LoadingScreen, TemplateSection } from '../../src/components';
import { useSubject, useEntries, useCreateEntry, useCreateEntryWithTemplate, useHardDeleteSubject, useWorkoutTemplate } from '../../src/hooks';

export default function SubjectDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: subjectLoading } = useSubject(id);
  const { data: entries, isLoading: entriesLoading, refetch, isRefetching } = useEntries(id);
  const { data: template } = useWorkoutTemplate(id);
  const createEntry = useCreateEntry();
  const createEntryWithTemplate = useCreateEntryWithTemplate();
  const hardDelete = useHardDeleteSubject();
  const theme = useTheme();

  const isCreatingEntry = createEntry.isPending || createEntryWithTemplate.isPending;

  const handleDelete = useCallback((): void => {
    if (!subject || hardDelete.isPending) return;
    Alert.alert(
      'Delete Workout?',
      `This will permanently delete "${subject.name}" and all its sessions, exercises, and sets. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            hardDelete.mutate(id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ]
    );
  }, [subject, hardDelete, id]);

  const handleStartEntry = async (): Promise<void> => {
    if (!id || isCreatingEntry) return;

    try {
      let entry;

      // If template exists, create entry with template items
      if (template && template.length > 0) {
        const templateItems = template.map((item) => ({
          exercise_id: item.exercise_id,
          name: item.exercise.name,
          tracking_type: item.exercise.tracking_type,
          default_sets: item.default_sets,
        }));

        entry = await createEntryWithTemplate.mutateAsync({
          input: {
            subject_id: id,
            performed_at: getTodayISO(),
          },
          templateItems,
        });
      } else {
        // No template - create empty entry
        entry = await createEntry.mutateAsync({
          subject_id: id,
          performed_at: getTodayISO(),
        });
      }

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
          headerRight: () => hardDelete.isPending ? (
            <ActivityIndicator size="small" color={theme.error?.val} />
          ) : (
            <Stack
              paddingHorizontal={8}
              paddingVertical={4}
              borderRadius={6}
              pressStyle={{ opacity: 0.6 }}
              onPress={handleDelete}
            >
              <Text color="$error" fontSize={15} fontWeight="500">
                Delete
              </Text>
            </Stack>
          ),
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
            <TemplateSection subjectId={id} />
          </YStack>

          {/* Sessions Header */}
          <YStack paddingHorizontal={16} paddingTop={16} paddingBottom={8}>
            <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
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
              paddingBottom: 100,
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

          {/* Always show FAB to start session */}
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
            pressStyle={{
              scale: 0.94,
              backgroundColor: '$primaryDark',
            }}
            onPress={handleStartEntry}
          >
            {isCreatingEntry ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text color="white" fontWeight="600" fontSize={15}>
                + Start Session
              </Text>
            )}
          </Stack>
        </YStack>
      </SafeAreaView>
    </>
  );
}
