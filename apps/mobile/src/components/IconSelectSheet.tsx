import React, { useCallback } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import type { ExerciseIcon, WorkoutTemplateWithExercise } from '@progress/shared';

// Icon categories for organized display
const ICON_CATEGORIES: { label: string; icons: { icon: ExerciseIcon; label: string }[] }[] = [
  {
    label: 'Strength',
    icons: [
      { icon: 'dumbbell', label: 'Dumbbell' },
      { icon: 'weight-lifter', label: 'Lifter' },
      { icon: 'arm-flex', label: 'Bicep' },
      { icon: 'weight', label: 'Weight' },
      { icon: 'barbell', label: 'Barbell' },
    ],
  },
  {
    label: 'Body & Flexibility',
    icons: [
      { icon: 'human', label: 'Standing' },
      { icon: 'human-handsup', label: 'Arms Up' },
      { icon: 'human-handsdown', label: 'Arms Down' },
      { icon: 'yoga', label: 'Yoga' },
      { icon: 'meditation', label: 'Meditate' },
      { icon: 'stretch', label: 'Stretch' },
      { icon: 'kabaddi', label: 'Lunge' },
      { icon: 'karate', label: 'Kick' },
    ],
  },
  {
    label: 'Cardio',
    icons: [
      { icon: 'run', label: 'Run' },
      { icon: 'run-fast', label: 'Sprint' },
      { icon: 'walk', label: 'Walk' },
      { icon: 'bike', label: 'Bike' },
      { icon: 'rowing', label: 'Row' },
      { icon: 'swim', label: 'Swim' },
      { icon: 'jump-rope', label: 'Jump Rope' },
      { icon: 'stairs-up', label: 'Stairs Up' },
      { icon: 'stairs', label: 'Stairs' },
    ],
  },
  {
    label: 'Sports & Other',
    icons: [
      { icon: 'gymnastics', label: 'Gymnast' },
      { icon: 'boxing-glove', label: 'Boxing' },
      { icon: 'basketball', label: 'Basketball' },
      { icon: 'soccer', label: 'Soccer' },
      { icon: 'tennis', label: 'Tennis' },
      { icon: 'heart-pulse', label: 'Cardio' },
      { icon: 'timer-outline', label: 'Timed' },
    ],
  },
];

interface IconSelectSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectIcon: (icon: ExerciseIcon) => void;
  templateItem: WorkoutTemplateWithExercise | null;
  isLoading?: boolean;
}

export function IconSelectSheet({
  open,
  onClose,
  onSelectIcon,
  templateItem,
  isLoading = false,
}: IconSelectSheetProps): React.ReactElement {
  const theme = useTheme();

  const handleSelect = useCallback((icon: ExerciseIcon) => {
    onSelectIcon(icon);
  }, [onSelectIcon]);

  const currentIcon = templateItem?.exercise.icon ?? 'dumbbell';
  const isCustomExercise = templateItem?.exercise.is_system === false;

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
          <Text fontWeight="700" fontSize={17}>Change Icon</Text>
          <Pressable
            onPress={onClose}
            style={{ cursor: 'pointer', userSelect: 'none', width: 60, alignItems: 'flex-end' } as never}
          >
            <Text fontSize={16} fontWeight="600" color="$primary">
              Done
            </Text>
          </Pressable>
        </XStack>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Exercise name header */}
          {templateItem && (
            <XStack
              backgroundColor="$backgroundHover"
              padding="$3"
              borderRadius="$3"
              alignItems="center"
              gap="$3"
              marginBottom="$4"
            >
              <YStack
                width={48}
                height={48}
                borderRadius={24}
                backgroundColor="$purple5"
                alignItems="center"
                justifyContent="center"
              >
                <MaterialCommunityIcons
                  name={currentIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={26}
                  color={theme.purple10?.val ?? '#8B5CF6'}
                />
              </YStack>
              <YStack flex={1}>
                <Text fontSize={16} fontWeight="600" color="$color">
                  {templateItem.exercise.name}
                </Text>
                <Text fontSize={13} color="$textMuted">
                  {templateItem.exercise.muscle_group}
                </Text>
              </YStack>
            </XStack>
          )}

          {/* Info message for system exercises */}
          {!isCustomExercise && (
            <YStack
              backgroundColor="$blue5"
              padding="$3"
              borderRadius="$3"
              marginBottom="$4"
            >
              <XStack alignItems="center" gap="$2">
                <MaterialCommunityIcons
                  name="information"
                  size={18}
                  color={theme.blue10?.val ?? '#3B82F6'}
                />
                <Text fontSize={13} color="$blue10" flex={1}>
                  Icon changes for system exercises are saved locally.
                </Text>
              </XStack>
            </YStack>
          )}

          {/* Icon categories */}
          {ICON_CATEGORIES.map((category) => (
            <YStack key={category.label} gap="$2" marginBottom="$4">
              <Text fontSize={13} fontWeight="600" color="$textMuted">
                {category.label}
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {category.icons.map(({ icon, label }) => {
                  const isSelected = currentIcon === icon;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => handleSelect(icon)}
                      disabled={isLoading}
                      style={{ cursor: 'pointer', userSelect: 'none', opacity: isLoading ? 0.5 : 1 } as never}
                    >
                      <YStack
                        width={70}
                        height={70}
                        borderRadius="$3"
                        backgroundColor={isSelected ? '$primary' : '$backgroundHover'}
                        alignItems="center"
                        justifyContent="center"
                        gap="$0.5"
                      >
                        <MaterialCommunityIcons
                          name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={26}
                          color={isSelected ? '#fff' : (theme.purple10?.val ?? '#8B5CF6')}
                        />
                        <Text
                          fontSize={9}
                          fontWeight="500"
                          color={isSelected ? 'white' : '$textMuted'}
                          textAlign="center"
                        >
                          {label}
                        </Text>
                      </YStack>
                    </Pressable>
                  );
                })}
              </XStack>
            </YStack>
          ))}
        </ScrollView>

        {/* Bottom action */}
        <YStack padding="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <Button
            variant="secondary"
            size="medium"
            onPress={onClose}
            fullWidth
          >
            Close
          </Button>
        </YStack>
      </YStack>
    </Modal>
  );
}
