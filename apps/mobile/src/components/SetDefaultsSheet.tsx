import React, { useState, useCallback, useEffect } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './Button';
import { Input } from './Input';
import type { TemplateSetConfig, WorkoutTemplateWithExercise } from '@progress/shared';

interface SetDefaultsSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: (sets: TemplateSetConfig[]) => void;
  templateItem: WorkoutTemplateWithExercise | null;
}

// Same reps presets
const SAME_REPS_PRESETS: { label: string; sets: TemplateSetConfig[] }[] = [
  { label: '3×10', sets: [{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }] },
  { label: '4×8', sets: [{ target_reps: 8 }, { target_reps: 8 }, { target_reps: 8 }, { target_reps: 8 }] },
  { label: '5×5', sets: [{ target_reps: 5 }, { target_reps: 5 }, { target_reps: 5 }, { target_reps: 5 }, { target_reps: 5 }] },
  { label: '3×15', sets: [{ target_reps: 15 }, { target_reps: 15 }, { target_reps: 15 }] },
];

// Pyramid presets (reps change each set)
const PYRAMID_PRESETS: { label: string; sets: TemplateSetConfig[] }[] = [
  { label: '12/10/8', sets: [{ target_reps: 12 }, { target_reps: 10 }, { target_reps: 8 }] },
  { label: '15/12/10/8', sets: [{ target_reps: 15 }, { target_reps: 12 }, { target_reps: 10 }, { target_reps: 8 }] },
  { label: '10/8/6/4', sets: [{ target_reps: 10 }, { target_reps: 8 }, { target_reps: 6 }, { target_reps: 4 }] },
  { label: '6/8/10/12', sets: [{ target_reps: 6 }, { target_reps: 8 }, { target_reps: 10 }, { target_reps: 12 }] },
];

export function SetDefaultsSheet({ open, onClose, onSave, templateItem }: SetDefaultsSheetProps): React.ReactElement {
  const theme = useTheme();
  const [customSets, setCustomSets] = useState<number[]>([10, 10, 10]);

  // Initialize from template item when opened
  useEffect(() => {
    if (open && templateItem?.default_sets) {
      const reps = templateItem.default_sets.map(s => s.target_reps ?? 10);
      setCustomSets(reps.length > 0 ? reps : [10, 10, 10]);
    }
  }, [open, templateItem]);

  const handlePresetSelect = useCallback((preset: TemplateSetConfig[]) => {
    onSave(preset);
    onClose();
  }, [onSave, onClose]);

  const handleCustomSave = useCallback(() => {
    const sets: TemplateSetConfig[] = customSets.map(reps => ({ target_reps: reps }));
    onSave(sets);
    onClose();
  }, [customSets, onSave, onClose]);

  const handleSetChange = useCallback((index: number, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setCustomSets(prev => prev.map((v, i) => i === index ? numValue : v));
  }, []);

  const handleAddSet = useCallback(() => {
    setCustomSets(prev => [...prev, prev[prev.length - 1] ?? 10]);
  }, []);

  const handleRemoveSet = useCallback((index: number) => {
    if (customSets.length <= 1) return;
    setCustomSets(prev => prev.filter((_, i) => i !== index));
  }, [customSets.length]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Check if current custom sets match a preset
  const matchesPreset = (preset: TemplateSetConfig[]): boolean => {
    if (preset.length !== customSets.length) return false;
    return preset.every((p, i) => p.target_reps === customSets[i]);
  };

  // Render preset chips
  const renderPresets = (presets: { label: string; sets: TemplateSetConfig[] }[]) => (
    <XStack gap="$2">
      {presets.map((preset) => {
        const isSelected = matchesPreset(preset.sets);
        return (
          <Pressable
            key={preset.label}
            onPress={() => handlePresetSelect(preset.sets)}
            style={{ cursor: 'pointer', userSelect: 'none', flex: 1 } as never}
          >
            <Stack
              paddingVertical="$2.5"
              borderRadius="$3"
              backgroundColor={isSelected ? '$primary' : '$backgroundHover'}
              borderWidth={1}
              borderColor={isSelected ? '$primary' : 'transparent'}
              alignItems="center"
            >
              <Text
                fontSize={14}
                fontWeight="600"
                color={isSelected ? 'white' : '$color'}
              >
                {preset.label}
              </Text>
            </Stack>
          </Pressable>
        );
      })}
    </XStack>
  );

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
          <Text fontWeight="700" fontSize={17}>Set Defaults</Text>
          <Button variant="primary" size="small" onPress={handleCustomSave}>
            Save
          </Button>
        </XStack>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {/* Exercise name */}
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
                width={40}
                height={40}
                borderRadius={20}
                backgroundColor="$purple5"
                alignItems="center"
                justifyContent="center"
              >
                <MaterialCommunityIcons
                  name={templateItem.exercise.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={22}
                  color={theme.purple10?.val ?? '#8B5CF6'}
                />
              </YStack>
              <Text fontSize={16} fontWeight="600" color="$color">
                {templateItem.exercise.name}
              </Text>
            </XStack>
          )}

          {/* Same Reps Presets */}
          <YStack gap="$3" marginBottom="$4">
            <Text fontSize={13} fontWeight="600" color="$textMuted">
              Same Reps
            </Text>
            {renderPresets(SAME_REPS_PRESETS)}
          </YStack>

          {/* Pyramid Presets */}
          <YStack gap="$3" marginBottom="$6">
            <Text fontSize={13} fontWeight="600" color="$textMuted">
              Pyramid
            </Text>
            {renderPresets(PYRAMID_PRESETS)}
          </YStack>

          {/* Custom sets editor */}
          <YStack gap="$3">
            <Text fontSize={13} fontWeight="600" color="$textMuted">
              Customize Sets
            </Text>

            <YStack gap="$2">
              {customSets.map((reps, index) => (
                <XStack
                  key={index}
                  backgroundColor="$backgroundHover"
                  paddingVertical="$2.5"
                  paddingLeft="$3"
                  paddingRight="$2"
                  borderRadius="$3"
                  alignItems="center"
                  gap="$2"
                >
                  <Text fontSize={14} color="$textMuted" width={44}>
                    Set {index + 1}
                  </Text>
                  <Input
                    value={reps.toString()}
                    onChangeText={(v) => handleSetChange(index, v)}
                    keyboardType="number-pad"
                    style={{ flex: 1, textAlign: 'center' }}
                    placeholder="reps"
                  />
                  <Text fontSize={14} color="$textMuted">reps</Text>
                  {customSets.length > 1 ? (
                    <Pressable
                      onPress={() => handleRemoveSet(index)}
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
                          name="minus"
                          size={18}
                          color={theme.error?.val ?? '#EF4444'}
                        />
                      </Stack>
                    </Pressable>
                  ) : (
                    <Stack width={32} height={32} />
                  )}
                </XStack>
              ))}
            </YStack>

            <Button
              variant="secondary"
              size="small"
              onPress={handleAddSet}
            >
              + Add Set
            </Button>
          </YStack>

          {/* Preview */}
          <YStack marginTop="$6" gap="$2">
            <Text fontSize={13} fontWeight="600" color="$textMuted">
              Preview
            </Text>
            <Stack
              backgroundColor="$purple5"
              padding="$3"
              borderRadius="$3"
            >
              <Text fontSize={16} fontWeight="600" color="$primary" textAlign="center">
                {customSets.length > 0 && customSets.every(r => r === customSets[0])
                  ? `${customSets.length}×${customSets[0]}`
                  : customSets.join(' / ')}
              </Text>
            </Stack>
          </YStack>
        </ScrollView>
      </YStack>
    </Modal>
  );
}
