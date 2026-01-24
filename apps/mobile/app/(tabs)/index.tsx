import React, { useState } from 'react';
import { FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatRelativeDate } from '@progress/shared';
import { Card, Button, EmptyState } from '../../src/components';
import { useSubjectsWithStats } from '../../src/hooks';
import { CreateSubjectModal } from '../../src/components/CreateSubjectModal';
import type { SubjectWithStats } from '@progress/shared';

export default function WorkoutsScreen(): React.ReactElement {
  const { data: subjects, isLoading, refetch, isRefetching } = useSubjectsWithStats();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSubjectPress = (subject: SubjectWithStats): void => {
    router.push({
      pathname: '/subject/[id]',
      params: { id: subject.id },
    });
  };

  const renderSubject = ({ item }: { item: SubjectWithStats }): React.ReactElement => (
    <Card
      pressable
      onPress={() => handleSubjectPress(item)}
      style={{ marginHorizontal: 16, marginBottom: 12 }}
    >
      <YStack gap="$2">
        <Text fontSize="$5" fontWeight="600" color="$color">
          {item.name}
        </Text>
        {item.description && (
          <Text fontSize="$2" color="$placeholderColor" numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <XStack justifyContent="space-between" marginTop="$1">
          <Text fontSize="$2" color="$placeholderColor">
            {item.entry_count} {item.entry_count === 1 ? 'entry' : 'entries'}
          </Text>
          {item.last_entry_date && (
            <Text fontSize="$2" color="$placeholderColor">
              Last: {formatRelativeDate(item.last_entry_date)}
            </Text>
          )}
        </XStack>
      </YStack>
    </Card>
  );

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
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
              onPress={() => setShowCreateModal(true)}
            >
              New Workout
            </Button>
          </YStack>
        )}

        <CreateSubjectModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </YStack>
    </SafeAreaView>
  );
}
