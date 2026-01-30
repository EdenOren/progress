import React, { useCallback, useState, useMemo } from 'react';
import { Pressable, Modal, ScrollView } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutTemplate, useHardRemoveFromTemplate, useAddExerciseToTemplate, useUpdateTemplateItem } from '../hooks/useTemplates';
import { showSuccessToast } from '../utils';
import { AddExerciseSheet } from './AddExerciseSheet';
import { SetDefaultsSheet } from './SetDefaultsSheet';
import { Button } from './Button';
import type { Exercise, WorkoutTemplateWithExercise, TemplateSetConfig } from '@progress/shared';

interface TemplateSectionProps {
  subjectId: string;
}

export function TemplateSection({ subjectId }: TemplateSectionProps): React.ReactElement {
  const theme = useTheme();
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showSetDefaultsSheet, setShowSetDefaultsSheet] = useState(false);
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<WorkoutTemplateWithExercise | null>(null);

  const { data: template, isLoading } = useWorkoutTemplate(subjectId);
  const removeFromTemplate = useHardRemoveFromTemplate(subjectId);
  const addExercise = useAddExerciseToTemplate(subjectId);
  const updateTemplate = useUpdateTemplateItem(subjectId);

  // Get IDs of exercises already in the template
  const templateExerciseIds = useMemo(() =>
    template?.map(item => item.exercise_id) ?? [],
    [template]
  );

  const handleAddExercises = useCallback((exercises: Exercise[]) => {
    exercises.forEach(exercise => {
      addExercise.mutate({
        exerciseId: exercise.id,
        defaultSets: [{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }],
      });
    });
  }, [addExercise]);

  const handleRemoveExercise = useCallback((item: WorkoutTemplateWithExercise) => {
    removeFromTemplate.mutate(item.id, {
      onSuccess: () => showSuccessToast('Exercise removed'),
    });
  }, [removeFromTemplate]);

  const handleEditSets = useCallback((item: WorkoutTemplateWithExercise) => {
    setSelectedTemplateItem(item);
    setShowSetDefaultsSheet(true);
  }, []);

  const handleSaveSets = useCallback((sets: TemplateSetConfig[]) => {
    if (!selectedTemplateItem) return;
    updateTemplate.mutate({
      templateItemId: selectedTemplateItem.id,
      updates: { default_sets: sets },
    }, {
      onSuccess: () => showSuccessToast('Sets updated'),
    });
  }, [selectedTemplateItem, updateTemplate]);

  const formatDefaultSets = (item: WorkoutTemplateWithExercise): string => {
    const sets = item.default_sets;
    if (!sets || sets.length === 0) return '';

    const firstReps = sets[0]?.target_reps;
    const firstDuration = sets[0]?.target_duration_seconds;

    if (firstReps && sets.every(s => s.target_reps === firstReps)) {
      return `${sets.length}×${firstReps}`;
    }

    if (firstDuration) {
      const mins = Math.floor(firstDuration / 60);
      return mins > 0 ? `${mins} min` : `${firstDuration}s`;
    }

    return sets.map(s => s.target_reps ?? '?').join('/');
  };

  const exerciseCount = template?.length ?? 0;

  if (isLoading) {
    return (
      <YStack padding="$4">
        <Text color="$textMuted">Loading template...</Text>
      </YStack>
    );
  }

  // Render exercise row (used in both collapsed preview and modal)
  const renderExerciseRow = (item: WorkoutTemplateWithExercise, index: number) => (
    <XStack
      key={item.id}
      backgroundColor="$backgroundHover"
      borderRadius="$3"
      padding="$3"
      alignItems="center"
      gap="$3"
    >
      {/* Position indicator */}
      <YStack
        width={28}
        height={28}
        borderRadius={14}
        backgroundColor="$background"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={12} fontWeight="600" color="$textMuted">
          {index + 1}
        </Text>
      </YStack>

      {/* Exercise icon */}
      <YStack
        width={36}
        height={36}
        borderRadius={18}
        backgroundColor="$purple5"
        alignItems="center"
        justifyContent="center"
      >
        <MaterialCommunityIcons
          name={item.exercise.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={20}
          color={theme.purple10?.val ?? '#8B5CF6'}
        />
      </YStack>

      {/* Exercise info */}
      <Pressable
        onPress={() => handleEditSets(item)}
        style={{ flex: 1, cursor: 'pointer', userSelect: 'none' } as never}
      >
        <YStack>
          <Text fontSize={15} fontWeight="600" color="$color">
            {item.exercise.name}
          </Text>
          <XStack alignItems="center" gap="$1">
            <Text fontSize={12} color="$primary" fontWeight="600">
              {formatDefaultSets(item)}
            </Text>
            <Text fontSize={12} color="$textMuted">
              · {item.exercise.muscle_group}
            </Text>
            <MaterialCommunityIcons
              name="pencil"
              size={12}
              color={theme.primary?.val ?? '#8B5CF6'}
            />
          </XStack>
        </YStack>
      </Pressable>

      {/* Remove button */}
      <Pressable
        onPress={() => handleRemoveExercise(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ cursor: 'pointer', userSelect: 'none' } as never}
      >
        <Stack
          width={32}
          height={32}
          borderRadius={16}
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
  );

  return (
    <YStack>
      {/* Collapsed Summary Row */}
      <Pressable
        onPress={() => exerciseCount > 0 && setShowExerciseList(true)}
        style={{ cursor: exerciseCount > 0 ? 'pointer' : 'default', userSelect: 'none' } as never}
      >
        <XStack
          marginHorizontal="$4"
          backgroundColor="$backgroundHover"
          borderRadius="$3"
          padding="$3"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap="$3">
            <Stack
              width={40}
              height={40}
              borderRadius={20}
              backgroundColor="$purple5"
              alignItems="center"
              justifyContent="center"
            >
              <MaterialCommunityIcons
                name="dumbbell"
                size={22}
                color={theme.purple10?.val ?? '#8B5CF6'}
              />
            </Stack>
            <YStack>
              <Text fontSize={16} fontWeight="600" color="$color">
                {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'}
              </Text>
              {exerciseCount > 0 && (
                <Text fontSize={12} color="$textMuted">
                  Tap to view & edit
                </Text>
              )}
            </YStack>
          </XStack>

          <XStack alignItems="center" gap="$2">
            {exerciseCount > 0 && (
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={theme.textMuted?.val ?? '#666'}
              />
            )}
          </XStack>
        </XStack>
      </Pressable>

      {/* Add Button (always visible) */}
      <XStack paddingHorizontal="$4" paddingTop="$3">
        <Button
          variant="secondary"
          size="small"
          onPress={() => setShowAddSheet(true)}
          fullWidth
        >
          + Add Exercise
        </Button>
      </XStack>

      {/* Full Screen Exercise List Modal */}
      <Modal
        visible={showExerciseList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseList(false)}
      >
        <YStack flex={1} backgroundColor="$background">
          {/* Header */}
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Stack width={60} />
            <Text fontWeight="700" fontSize={17}>
              {exerciseCount} {exerciseCount === 1 ? 'Exercise' : 'Exercises'}
            </Text>
            <Pressable
              onPress={() => setShowExerciseList(false)}
              style={{ cursor: 'pointer', userSelect: 'none', width: 60, alignItems: 'flex-end' } as never}
            >
              <Text fontSize={16} fontWeight="600" color="$primary">
                Done
              </Text>
            </Pressable>
          </XStack>

          {/* Exercise List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            <YStack gap="$2">
              {template?.map((item, index) => renderExerciseRow(item, index))}
            </YStack>

            {/* Add more button in modal */}
            <YStack paddingTop="$4">
              <Button
                variant="secondary"
                size="medium"
                onPress={() => {
                  setShowExerciseList(false);
                  setTimeout(() => setShowAddSheet(true), 300);
                }}
                fullWidth
              >
                + Add Exercise
              </Button>
            </YStack>
          </ScrollView>
        </YStack>
      </Modal>

      {/* Add Exercise Sheet */}
      <AddExerciseSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSelectMultiple={handleAddExercises}
        excludeIds={templateExerciseIds}
      />

      {/* Set Defaults Sheet */}
      <SetDefaultsSheet
        open={showSetDefaultsSheet}
        onClose={() => {
          setShowSetDefaultsSheet(false);
          setSelectedTemplateItem(null);
        }}
        onSave={handleSaveSets}
        templateItem={selectedTemplateItem}
      />
    </YStack>
  );
}
