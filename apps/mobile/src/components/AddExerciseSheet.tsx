import React, { useState, useCallback, useMemo } from 'react';
import { Modal, FlatList, TextInput as RNTextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { Input } from './Input';
import { useSearchExercises, useAllExercises, useCreateCustomExercise } from '../hooks/useExercises';
import type { Exercise, ExerciseIcon, MuscleGroup, TrackingType, ExerciseCategory } from '@progress/shared';

interface AddExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const AVAILABLE_ICONS: ExerciseIcon[] = [
  'dumbbell', 'weight-lifter', 'arm-flex', 'human-handsup', 'human',
  'run', 'bike', 'rowing', 'yoga', 'stairs-up'
];

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'
];

const CATEGORIES: ExerciseCategory[] = ['strength', 'bodyweight', 'cardio', 'flexibility'];

const TRACKING_TYPES: { value: TrackingType; label: string }[] = [
  { value: 'weight_reps', label: 'Weight & Reps' },
  { value: 'duration', label: 'Duration' },
  { value: 'distance', label: 'Distance' },
];

export function AddExerciseSheet({ open, onClose, onSelect }: AddExerciseSheetProps): React.ReactElement {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState<ExerciseIcon>('dumbbell');
  const [newMuscleGroup, setNewMuscleGroup] = useState<MuscleGroup>('chest');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('strength');
  const [newTrackingType, setNewTrackingType] = useState<TrackingType>('weight_reps');

  const { data: searchResults, isLoading: isSearching } = useSearchExercises(searchQuery);
  const { data: allExercises } = useAllExercises();
  const createExercise = useCreateCustomExercise();

  // Show search results if query, otherwise show all exercises
  const exercises = useMemo(() => {
    if (searchQuery.length > 0) {
      return searchResults ?? [];
    }
    return allExercises ?? [];
  }, [searchQuery, searchResults, allExercises]);

  // Check if exact match exists
  const hasExactMatch = useMemo(() => {
    if (!searchQuery) return true;
    return exercises.some(e => e.name.toLowerCase() === searchQuery.toLowerCase());
  }, [exercises, searchQuery]);

  const handleSelect = useCallback((exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearchQuery('');
    setShowCreateForm(false);
  }, [onSelect, onClose]);

  const handleCreateCustom = useCallback(async () => {
    if (!newName.trim()) return;

    createExercise.mutate({
      name: newName.trim(),
      icon: newIcon,
      muscle_group: newMuscleGroup,
      category: newCategory,
      tracking_type: newTrackingType,
    }, {
      onSuccess: (exercise) => {
        handleSelect(exercise);
      },
    });
  }, [newName, newIcon, newMuscleGroup, newCategory, newTrackingType, createExercise, handleSelect]);

  const handleShowCreateForm = useCallback(() => {
    setNewName(searchQuery);
    setShowCreateForm(true);
  }, [searchQuery]);

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
    setShowCreateForm(false);
    setNewName('');
    setNewIcon('dumbbell');
    setNewMuscleGroup('chest');
    setNewCategory('strength');
    setNewTrackingType('weight_reps');
  }, [onClose]);

  const renderExerciseItem = useCallback(({ item }: { item: Exercise }) => (
    <Pressable onPress={() => handleSelect(item)} style={{ cursor: 'pointer' }}>
      <XStack
        paddingVertical="$3"
        paddingHorizontal="$4"
        alignItems="center"
        gap="$3"
        backgroundColor="$background"
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        pressStyle={{ backgroundColor: '$backgroundPress' }}
      >
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor="$purple5"
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={22}
            color={theme.purple10?.val ?? '#8B5CF6'}
          />
        </YStack>
        <YStack flex={1}>
          <Text fontWeight="600" color="$text">
            {item.name}
          </Text>
          <Text fontSize={12} color="$textMuted">
            {item.muscle_group} · {item.category}
          </Text>
        </YStack>
        {!item.is_system && (
          <Text fontSize={11} color="$textMuted">Custom</Text>
        )}
      </XStack>
    </Pressable>
  ), [handleSelect, theme]);

  // Create form view
  if (showCreateForm) {
    return (
      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
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
              <Button
                variant="ghost"
                size="small"
                onPress={() => setShowCreateForm(false)}
              >
                Back
              </Button>
              <Text fontWeight="700" fontSize={17}>Create Exercise</Text>
              <Button
                variant="ghost"
                size="small"
                onPress={handleCreateCustom}
                disabled={!newName.trim()}
                loading={createExercise.isPending}
              >
                Save
              </Button>
            </XStack>

            {/* Form */}
            <YStack padding="$4" gap="$4">
              {/* Name */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="$textMuted">NAME</Text>
                <Input
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Exercise name"
                  autoFocus
                />
              </YStack>

              {/* Icon Picker */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="$textMuted">ICON</Text>
                <XStack flexWrap="wrap" gap="$2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <Pressable key={icon} onPress={() => setNewIcon(icon)} style={{ cursor: 'pointer' }}>
                      <YStack
                        width={48}
                        height={48}
                        borderRadius={24}
                        backgroundColor={newIcon === icon ? '$purple5' : '$backgroundHover'}
                        alignItems="center"
                        justifyContent="center"
                        borderWidth={2}
                        borderColor={newIcon === icon ? '$purple10' : 'transparent'}
                      >
                        <MaterialCommunityIcons
                          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={newIcon === icon ? (theme.purple10?.val ?? '#8B5CF6') : (theme.textMuted?.val ?? '#666')}
                        />
                      </YStack>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>

              {/* Muscle Group */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="$textMuted">MUSCLE GROUP</Text>
                <XStack flexWrap="wrap" gap="$2">
                  {MUSCLE_GROUPS.map((group) => (
                    <Pressable key={group} onPress={() => setNewMuscleGroup(group)} style={{ cursor: 'pointer' }}>
                      <YStack
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$3"
                        backgroundColor={newMuscleGroup === group ? '$purple5' : '$backgroundHover'}
                        borderWidth={1}
                        borderColor={newMuscleGroup === group ? '$purple10' : 'transparent'}
                      >
                        <Text
                          fontSize={13}
                          fontWeight={newMuscleGroup === group ? '600' : '400'}
                          color={newMuscleGroup === group ? '$purple10' : '$text'}
                          textTransform="capitalize"
                        >
                          {group.replace('_', ' ')}
                        </Text>
                      </YStack>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>

              {/* Category */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="$textMuted">CATEGORY</Text>
                <XStack flexWrap="wrap" gap="$2">
                  {CATEGORIES.map((cat) => (
                    <Pressable key={cat} onPress={() => setNewCategory(cat)} style={{ cursor: 'pointer' }}>
                      <YStack
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$3"
                        backgroundColor={newCategory === cat ? '$purple5' : '$backgroundHover'}
                        borderWidth={1}
                        borderColor={newCategory === cat ? '$purple10' : 'transparent'}
                      >
                        <Text
                          fontSize={13}
                          fontWeight={newCategory === cat ? '600' : '400'}
                          color={newCategory === cat ? '$purple10' : '$text'}
                          textTransform="capitalize"
                        >
                          {cat}
                        </Text>
                      </YStack>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>

              {/* Tracking Type */}
              <YStack gap="$2">
                <Text fontSize={13} fontWeight="600" color="$textMuted">TRACKING TYPE</Text>
                <XStack flexWrap="wrap" gap="$2">
                  {TRACKING_TYPES.map(({ value, label }) => (
                    <Pressable key={value} onPress={() => setNewTrackingType(value)} style={{ cursor: 'pointer' }}>
                      <YStack
                        paddingHorizontal="$3"
                        paddingVertical="$2"
                        borderRadius="$3"
                        backgroundColor={newTrackingType === value ? '$purple5' : '$backgroundHover'}
                        borderWidth={1}
                        borderColor={newTrackingType === value ? '$purple10' : 'transparent'}
                      >
                        <Text
                          fontSize={13}
                          fontWeight={newTrackingType === value ? '600' : '400'}
                          color={newTrackingType === value ? '$purple10' : '$text'}
                        >
                          {label}
                        </Text>
                      </YStack>
                    </Pressable>
                  ))}
                </XStack>
              </YStack>
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Search view
  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
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
          <Button variant="ghost" size="small" onPress={handleClose}>
            Cancel
          </Button>
          <Text fontWeight="700" fontSize={17}>Add Exercise</Text>
          <YStack width={60} />
        </XStack>

        {/* Search Input */}
        <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <XStack
            backgroundColor="$backgroundHover"
            borderRadius="$3"
            paddingHorizontal="$3"
            alignItems="center"
            gap="$2"
          >
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.textMuted?.val ?? '#666'}
            />
            <RNTextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor={theme.textMuted?.val ?? '#666'}
              style={{
                flex: 1,
                paddingVertical: 12,
                fontSize: 16,
                color: theme.text?.val ?? '#fff',
              }}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching && (
              <ActivityIndicator size="small" color={theme.primary?.val} />
            )}
          </XStack>
        </YStack>

        {/* Exercise List */}
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          ListHeaderComponent={
            // Show "Create custom" option if no exact match
            !hasExactMatch && searchQuery.length > 0 ? (
              <Pressable onPress={handleShowCreateForm} style={{ cursor: 'pointer' }}>
                <XStack
                  paddingVertical="$3"
                  paddingHorizontal="$4"
                  alignItems="center"
                  gap="$3"
                  backgroundColor="$purple5"
                >
                  <YStack
                    width={40}
                    height={40}
                    borderRadius={20}
                    backgroundColor="$purple10"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={22}
                      color="#fff"
                    />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontWeight="600" color="$text">
                      Create "{searchQuery}"
                    </Text>
                    <Text fontSize={12} color="$textMuted">
                      Add as custom exercise
                    </Text>
                  </YStack>
                </XStack>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            !isSearching ? (
              <YStack padding="$8" alignItems="center">
                <Text color="$textMuted">
                  {searchQuery ? 'No exercises found' : 'Type to search exercises'}
                </Text>
              </YStack>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
        />
      </YStack>
    </Modal>
  );
}
