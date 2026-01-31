import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack as RouterStack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, formatRelativeDate, getTodayISO } from '@progress/shared';
import type { Entry } from '@progress/shared';
import { Card, EmptyState, LoadingScreen, TemplateSection } from '../../src/components';
import { useSubject, useEntries, useCreateEntry, useCreateEntryWithTemplate, useHardDeleteSubject, useWorkoutTemplate, useDeleteEntry } from '../../src/hooks';
import { showSuccessToast } from '../../src/utils';

export default function SubjectDetailScreen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: subjectLoading } = useSubject(id);
  const { data: entries, isLoading: entriesLoading, refetch, isRefetching } = useEntries(id);
  const { data: template } = useWorkoutTemplate(id);
  const createEntry = useCreateEntry();
  const createEntryWithTemplate = useCreateEntryWithTemplate();
  const hardDelete = useHardDeleteSubject();
  const deleteEntry = useDeleteEntry();
  const theme = useTheme();
  const [confirmText, setConfirmText] = useState('');

  const isCreatingEntry = createEntry.isPending || createEntryWithTemplate.isPending;
  const canDelete = subject && confirmText.toLowerCase() === subject.name.toLowerCase();

  const handleDelete = useCallback((): void => {
    if (!subject || !canDelete || hardDelete.isPending) return;
    hardDelete.mutate(id, {
      onSuccess: () => {
        showSuccessToast('Workout deleted successfully');
        router.back();
      },
    });
  }, [subject, canDelete, hardDelete, id]);

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
            <TemplateSection subjectId={id} />
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
            ListFooterComponent={
              <YStack paddingHorizontal={16} paddingTop={32} paddingBottom={24}>
                {/* Danger Zone */}
                <YStack
                  borderWidth={1}
                  borderColor="$error"
                  borderRadius="$3"
                  padding="$4"
                  gap="$3"
                  backgroundColor="rgba(239, 68, 68, 0.05)"
                >
                  <XStack alignItems="center" gap="$2">
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={20}
                      color={theme.error?.val ?? '#EF4444'}
                    />
                    <Text fontSize={16} fontWeight="600" color="$error">
                      Danger Zone
                    </Text>
                  </XStack>

                  <Text fontSize={13} color="$textSecondary">
                    This will permanently delete this workout, all {entries?.length ?? 0} sessions, and all exercise data. This action cannot be undone.
                  </Text>

                  <YStack gap="$2">
                    <Text fontSize={13} color="$textMuted">
                      Type "{subject.name}" to confirm:
                    </Text>
                    <TextInput
                      style={{
                        height: 44,
                        backgroundColor: theme.background?.val ?? '#09090B',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: canDelete ? (theme.error?.val ?? '#EF4444') : (theme.borderColor?.val ?? '#27272A'),
                        paddingHorizontal: 12,
                        fontSize: 14,
                        color: theme.color?.val ?? '#FAFAFA',
                      }}
                      placeholder={subject.name}
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      value={confirmText}
                      onChangeText={setConfirmText}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </YStack>

                  <Pressable
                    onPress={handleDelete}
                    disabled={!canDelete || hardDelete.isPending}
                    style={{ cursor: canDelete ? 'pointer' : 'not-allowed', userSelect: 'none' } as never}
                  >
                    <Stack
                      backgroundColor={canDelete ? '$error' : '$backgroundHover'}
                      paddingVertical={12}
                      borderRadius="$2"
                      alignItems="center"
                      justifyContent="center"
                      opacity={hardDelete.isPending ? 0.7 : 1}
                    >
                      {hardDelete.isPending ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <XStack alignItems="center" gap="$2">
                          <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={18}
                            color={canDelete ? 'white' : (theme.textMuted?.val ?? '#71717A')}
                          />
                          <Text
                            fontSize={14}
                            fontWeight="600"
                            color={canDelete ? 'white' : '$textMuted'}
                          >
                            Delete Workout
                          </Text>
                        </XStack>
                      )}
                    </Stack>
                  </Pressable>
                </YStack>
              </YStack>
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
            cursor={isCreatingEntry ? 'not-allowed' : 'pointer'}
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
