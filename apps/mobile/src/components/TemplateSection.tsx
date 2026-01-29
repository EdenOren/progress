import React, { useCallback, useState, useMemo } from 'react';
import { Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutTemplate, useHardRemoveFromTemplate, useAddExerciseToTemplate } from '../hooks/useTemplates';
import { showSuccessToast } from '../utils';
import { AddExerciseSheet } from './AddExerciseSheet';
import type { Exercise, WorkoutTemplateWithExercise } from '@progress/shared';

interface TemplateSectionProps {
  subjectId: string;
}

export function TemplateSection({ subjectId }: TemplateSectionProps): React.ReactElement {
  const theme = useTheme();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const { data: template, isLoading } = useWorkoutTemplate(subjectId);
  const removeFromTemplate = useHardRemoveFromTemplate(subjectId);
  const addExercise = useAddExerciseToTemplate(subjectId);

  // Get IDs of exercises already in the template
  const templateExerciseIds = useMemo(() =>
    template?.map(item => item.exercise_id) ?? [],
    [template]
  );

  const handleAddExercises = useCallback((exercises: Exercise[]) => {
    // Add each exercise to the template
    exercises.forEach(exercise => {
      addExercise.mutate({
        exerciseId: exercise.id,
        defaultSets: [{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }], // Default 3x10
      });
    });
  }, [addExercise]);

  const handleRemoveExercise = useCallback((item: WorkoutTemplateWithExercise) => {
    removeFromTemplate.mutate(item.id, {
      onSuccess: () => showSuccessToast('Exercise removed successfully'),
    });
  }, [removeFromTemplate]);

  const formatDefaultSets = (item: WorkoutTemplateWithExercise): string => {
    const sets = item.default_sets;
    if (!sets || sets.length === 0) return '';

    // Check if all sets have the same target
    const firstReps = sets[0]?.target_reps;
    const firstDuration = sets[0]?.target_duration_seconds;

    if (firstReps && sets.every(s => s.target_reps === firstReps)) {
      return `${sets.length}×${firstReps}`;
    }

    if (firstDuration) {
      const mins = Math.floor(firstDuration / 60);
      return mins > 0 ? `${mins} min` : `${firstDuration}s`;
    }

    // Mixed sets - show individual
    return sets.map(s => s.target_reps ?? '?').join('/');
  };

  if (isLoading) {
    return (
      <YStack padding="$4">
        <Text color="$textMuted">Loading template...</Text>
      </YStack>
    );
  }

  return (
    <YStack>
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontSize={13} fontWeight="600" color="$textMuted">
          Exercises ({template?.length ?? 0})
        </Text>
        <Pressable onPress={() => setShowAddSheet(true)} style={{ cursor: 'pointer', userSelect: 'none' } as never}>
          <XStack alignItems="center" gap="$1">
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color={theme.primary?.val ?? '#8B5CF6'}
            />
            <Text fontSize={14} fontWeight="600" color="$primary">
              Add
            </Text>
          </XStack>
        </Pressable>
      </XStack>

      {/* Exercise List */}
      {template && template.length > 0 ? (
        <YStack gap="$2" paddingHorizontal="$4">
          {template.map((item, index) => (
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
              <YStack flex={1}>
                <Text fontSize={15} fontWeight="600" color="$color">
                  {item.exercise.name}
                </Text>
                <Text fontSize={12} color="$textMuted">
                  {formatDefaultSets(item)} · {item.exercise.muscle_group}
                </Text>
              </YStack>

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
          ))}
        </YStack>
      ) : (
        <YStack
          paddingHorizontal="$4"
          paddingVertical="$6"
          alignItems="center"
          gap="$2"
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={32}
            color={theme.textMuted?.val ?? '#666'}
          />
          <Text color="$textMuted" textAlign="center">
            No exercises added yet
          </Text>
          <Pressable onPress={() => setShowAddSheet(true)} style={{ cursor: 'pointer', userSelect: 'none' } as never}>
            <Text color="$primary" fontWeight="600">
              Add your first exercise
            </Text>
          </Pressable>
        </YStack>
      )}

      {/* Add Exercise Sheet */}
      <AddExerciseSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSelectMultiple={handleAddExercises}
        excludeIds={templateExerciseIds}
      />
    </YStack>
  );
}
