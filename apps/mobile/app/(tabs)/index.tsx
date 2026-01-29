import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRelativeDate } from '@progress/shared';
import { Card, EmptyState } from '../../src/components';
import { useSubjectsWithStats, useHardDeleteSubject } from '../../src/hooks';
import { showSuccessToast } from '../../src/utils';
import { CreateSubjectModal } from '../../src/components/CreateSubjectModal';
import type { SubjectWithStats } from '@progress/shared';

export default function WorkoutsScreen(): React.ReactElement {
  const { data: subjects, isLoading, refetch, isRefetching } = useSubjectsWithStats();
  const hardDelete = useHardDeleteSubject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const theme = useTheme();

  const handleSubjectPress = (subject: SubjectWithStats): void => {
    router.push({
      pathname: '/subject/[id]',
      params: { id: subject.id },
    });
  };

  const handleDeleteSubject = useCallback((subject: SubjectWithStats): void => {
    if (hardDelete.isPending) return;
    hardDelete.mutate(subject.id, {
      onSuccess: () => showSuccessToast('Workout deleted successfully'),
    });
  }, [hardDelete]);

  const renderSubject = ({ item }: { item: SubjectWithStats }): React.ReactElement => (
    <Stack marginHorizontal={16} marginBottom={12}>
      <Card pressable onPress={() => handleSubjectPress(item)}>
        <XStack gap={16}>
          <Stack
            width={3}
            backgroundColor="$primary"
            borderRadius={9999}
            alignSelf="stretch"
          />
          <YStack flex={1} gap={8}>
            <XStack justifyContent="space-between" alignItems="flex-start">
              <Text fontSize={18} fontWeight="600" color="$color" flex={1}>
                {item.name}
              </Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSubject(item);
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
            {item.description && (
              <Text fontSize={14} color="$textSecondary" numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <XStack justifyContent="space-between" alignItems="center" marginTop={4}>
              <Stack
                backgroundColor="$surfaceHover"
                paddingHorizontal={10}
                paddingVertical={4}
                borderRadius={9999}
              >
                <Text fontSize={12} color="$textSecondary">
                  {item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}
                </Text>
              </Stack>
              {item.last_entry_date && (
                <Text fontSize={12} color="$textMuted">
                  {formatRelativeDate(item.last_entry_date)}
                </Text>
              )}
            </XStack>
          </YStack>
        </XStack>
      </Card>
    </Stack>
  );

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <ActivityIndicator size="large" color={theme.primary?.val ?? '#8B5CF6'} />
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
      <YStack flex={1}>
        <FlatList
          data={subjects ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderSubject}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No workouts yet"
              message="Create your first workout routine to get started"
              actionLabel="Create Workout"
              onAction={() => setShowCreateModal(true)}
            />
          }
        />

        {(subjects?.length ?? 0) > 0 && (
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
            cursor="pointer"
            pressStyle={{
              scale: 0.94,
              backgroundColor: '$primaryDark',
            }}
            onPress={() => setShowCreateModal(true)}
          >
            <Text color="white" fontWeight="600" fontSize={15}>
              + New Workout
            </Text>
          </Stack>
        )}

        <CreateSubjectModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </YStack>
    </SafeAreaView>
  );
}
