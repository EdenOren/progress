import React, { useCallback, useState, useMemo } from 'react';
import { Pressable, Modal, ScrollView, Linking } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWorkoutTemplate, useHardRemoveFromTemplate, useBulkAddExercisesToTemplate, useUpdateTemplateItem } from '../hooks/useTemplates';
import { showSuccessToast } from '../utils';
import { AddExerciseSheet } from './AddExerciseSheet';
import { SetDefaultsSheet } from './SetDefaultsSheet';
import { IconSelectSheet } from './IconSelectSheet';
import { Button } from './Button';
import type { Exercise, WorkoutTemplateWithExercise, TemplateSetConfig, ExerciseIcon } from '@progress/shared';

interface TemplateSectionProps {
  subjectId: string;
  hasInProgressSession?: boolean;
  defaultSets?: Array<{ target_reps?: number }>;
}

export function TemplateSection({ subjectId, hasInProgressSession = false, defaultSets }: TemplateSectionProps): React.ReactElement {
  const theme = useTheme();
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showSetDefaultsSheet, setShowSetDefaultsSheet] = useState(false);
  const [selectedTemplateItem, setSelectedTemplateItem] = useState<WorkoutTemplateWithExercise | null>(null);

  // Future feature: Icon selection modal
  const [showIconModal, setShowIconModal] = useState(false);
  const [selectedExerciseForIcon, setSelectedExerciseForIcon] = useState<WorkoutTemplateWithExercise | null>(null);

  const { data: template, isLoading } = useWorkoutTemplate(subjectId);
  const removeFromTemplate = useHardRemoveFromTemplate(subjectId);
  const bulkAddExercises = useBulkAddExercisesToTemplate(subjectId);
  const updateTemplate = useUpdateTemplateItem(subjectId);

  // Get IDs of exercises already in the template
  const templateExerciseIds = useMemo(() =>
    template?.map(item => item.exercise_id) ?? [],
    [template]
  );

  const handleAddExercises = useCallback((exercises: Exercise[], overrideSets?: Array<{ target_reps: number }>) => {
    // Priority: overrideSets (from AddExerciseSheet) > defaultSets (from subject) > fallback
    const weightRepsSets = overrideSets ?? defaultSets ?? [{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }];
    // Distance/duration exercises always get 1 set (you do one run, not 3 sets of running)
    const cardioSets = [{}];

    // Use bulk mutation - single API call instead of one per exercise
    bulkAddExercises.mutate(
      exercises.map(exercise => ({
        exerciseId: exercise.id,
        // Use 1 set for distance/duration, otherwise use weight_reps defaults
        defaultSets: exercise.tracking_type === 'distance' || exercise.tracking_type === 'duration'
          ? cardioSets
          : weightRepsSets,
      }))
    );
  }, [bulkAddExercises, defaultSets]);

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

  const openYouTubeSearch = useCallback((exerciseName: string) => {
    const query = encodeURIComponent(`${exerciseName} exercise tutorial`);
    const url = `https://www.youtube.com/results?search_query=${query}`;
    Linking.openURL(url);
  }, []);

  // Open icon selection modal
  const handleIconPress = useCallback((item: WorkoutTemplateWithExercise) => {
    setSelectedExerciseForIcon(item);
    setShowIconModal(true);
  }, []);

  // Handle icon selection (for now just close - future: save to DB)
  const handleSelectIcon = useCallback((icon: ExerciseIcon) => {
    // TODO: Implement icon saving to database for custom exercises
    // For now, just show a toast and close
    showSuccessToast(`Icon "${icon}" selected`);
    setShowIconModal(false);
    setSelectedExerciseForIcon(null);
  }, []);

  // Future feature: Long press to reorder
  const handleExerciseLongPress = useCallback((_item: WorkoutTemplateWithExercise) => {
    // TODO: Implement drag-to-reorder functionality
    showSuccessToast('Drag to reorder coming soon');
  }, []);

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
  // Matches SetDefaultsSheet styling with smaller fonts
  const renderExerciseRow = (item: WorkoutTemplateWithExercise, index: number) => (
    <Pressable
      key={item.id}
      onLongPress={() => handleExerciseLongPress(item)}
      delayLongPress={400}
      style={{ cursor: 'default', userSelect: 'none' } as never}
    >
      <XStack
        backgroundColor="$backgroundHover"
        paddingVertical="$2.5"
        paddingLeft="$3"
        paddingRight="$2"
        borderRadius="$3"
        alignItems="center"
        gap="$2"
      >
        {/* Position indicator */}
        <Text fontSize={14} color="$textMuted" width={24}>
          {index + 1}
        </Text>

        {/* Exercise icon - tap to change */}
        <Pressable
          onPress={() => handleIconPress(item)}
          style={{ cursor: 'pointer', userSelect: 'none' } as never}
        >
          <YStack
            width={32}
            height={32}
            borderRadius={16}
            backgroundColor="$purple5"
            alignItems="center"
            justifyContent="center"
          >
            <MaterialCommunityIcons
              name={item.exercise.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={18}
              color={theme.purple10?.val ?? '#8B5CF6'}
            />
          </YStack>
        </Pressable>

      {/* Exercise info */}
      <Pressable
        onPress={() => handleEditSets(item)}
        style={{ flex: 1, cursor: 'pointer', userSelect: 'none' } as never}
      >
        <YStack>
          <Text fontSize={14} fontWeight="600" color="$color">
            {item.exercise.name}
          </Text>
          <XStack alignItems="center" gap="$1">
            <Text fontSize={11} color="$primary" fontWeight="600">
              {formatDefaultSets(item)}
            </Text>
            <Text fontSize={11} color="$textMuted">
              · {item.exercise.muscle_group}
            </Text>
            <MaterialCommunityIcons
              name="pencil"
              size={10}
              color={theme.primary?.val ?? '#8B5CF6'}
            />
          </XStack>
        </YStack>
      </Pressable>

      {/* YouTube button */}
      <Pressable
        onPress={() => openYouTubeSearch(item.exercise.name)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ cursor: 'pointer', userSelect: 'none' } as never}
      >
        <Stack
          width={28}
          height={28}
          borderRadius={14}
          backgroundColor="$purple5"
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name="youtube"
            size={16}
            color={theme.primary?.val ?? '#8B5CF6'}
          />
        </Stack>
      </Pressable>

      {/* Remove button - disabled during in-progress session */}
      <Pressable
        onPress={() => !hasInProgressSession && handleRemoveExercise(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ cursor: hasInProgressSession ? 'not-allowed' : 'pointer', userSelect: 'none', opacity: hasInProgressSession ? 0.3 : 1 } as never}
        disabled={hasInProgressSession}
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
            size={14}
            color={theme.error?.val ?? '#EF4444'}
          />
        </Stack>
      </Pressable>
      </XStack>
    </Pressable>
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

      {/* Add Button */}
      <XStack paddingHorizontal="$4" paddingTop="$3">
        <Button
          variant="ghost"
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
                variant="ghost"
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

      {/* Icon Selection Sheet */}
      <IconSelectSheet
        open={showIconModal}
        onClose={() => {
          setShowIconModal(false);
          setSelectedExerciseForIcon(null);
        }}
        onSelectIcon={handleSelectIcon}
        templateItem={selectedExerciseForIcon}
      />
    </YStack>
  );
}
