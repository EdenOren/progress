import React, { useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack } from '@tamagui/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSubject } from '../hooks';
import { getErrorMessage } from '../utils';
import { Button } from './Button';
import { Input } from './Input';

// Same reps presets (4 options)
const SAME_REPS_PRESETS = [
  { label: '3×10', sets: [{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }] },
  { label: '4×8', sets: [{ target_reps: 8 }, { target_reps: 8 }, { target_reps: 8 }, { target_reps: 8 }] },
  { label: '5×5', sets: [{ target_reps: 5 }, { target_reps: 5 }, { target_reps: 5 }, { target_reps: 5 }, { target_reps: 5 }] },
  { label: '3×15', sets: [{ target_reps: 15 }, { target_reps: 15 }, { target_reps: 15 }] },
];

// Pyramid presets (4 options)
const PYRAMID_PRESETS = [
  { label: '12/10/8', sets: [{ target_reps: 12 }, { target_reps: 10 }, { target_reps: 8 }] },
  { label: '15/12/10/8', sets: [{ target_reps: 15 }, { target_reps: 12 }, { target_reps: 10 }, { target_reps: 8 }] },
  { label: '10/8/6/4', sets: [{ target_reps: 10 }, { target_reps: 8 }, { target_reps: 6 }, { target_reps: 4 }] },
  { label: '6/8/10/12', sets: [{ target_reps: 6 }, { target_reps: 8 }, { target_reps: 10 }, { target_reps: 12 }] },
];

// Preset type
interface SetPreset {
  label: string;
  sets: Array<{ target_reps: number }>;
}

// Default preset (first same reps preset - guaranteed to exist)
const DEFAULT_PRESET: SetPreset = { label: '3×10', sets: [{ target_reps: 10 }, { target_reps: 10 }, { target_reps: 10 }] };

// Hardcoded workout domain ID (from seed.sql)
const WORKOUT_DOMAIN_ID = 'd0000000-0000-0000-0000-000000000001';

const createSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

type CreateSubjectForm = z.infer<typeof createSubjectSchema>;

interface CreateSubjectModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateSubjectModal({
  visible,
  onClose,
}: CreateSubjectModalProps): React.ReactElement {
  const createSubject = useCreateSubject();
  const [error, setError] = useState<string | null>(null);
  // Default sets configuration (TODO: persist to subject metadata)
  const [selectedPreset, setSelectedPreset] = useState<SetPreset>(DEFAULT_PRESET);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSubjectForm>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateSubjectForm): Promise<void> => {
    setError(null);

    try {
      await createSubject.mutateAsync({
        domain_id: WORKOUT_DOMAIN_ID,
        name: data.name,
        description: data.description || null,
      });

      reset();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleClose = (): void => {
    reset();
    setError(null);
    setSelectedPreset(DEFAULT_PRESET);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
          <Text fontSize="$6" fontWeight="700" color="$color">
            New Workout
          </Text>
          <Button variant="ghost" size="small" onPress={handleClose}>
            Cancel
          </Button>
        </XStack>

        {error && (
          <YStack
            marginBottom="$4"
            backgroundColor="rgba(239, 68, 68, 0.15)"
            padding={16}
            borderRadius={8}
          >
            <Text color="$error" fontSize={14}>
              {error}
            </Text>
          </YStack>
        )}

        <YStack gap="$4">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Name"
                placeholder="e.g., Monday Practice, Leg Day"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Description (optional)"
                placeholder="Brief description of this workout"
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.description?.message}
              />
            )}
          />

          {/* Default Sets Selection */}
          <YStack gap="$3">
            <YStack gap="$1">
              <Text fontSize={14} fontWeight="600" color="$color">
                Default Sets for Exercises
              </Text>
              <Text fontSize={12} color="$textMuted">
                Applied when adding new exercises
              </Text>
            </YStack>

            {/* Same Reps Section */}
            <YStack gap="$2">
              <Text fontSize={12} fontWeight="600" color="$textMuted">
                Same Reps
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {SAME_REPS_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.label}
                    onPress={() => setSelectedPreset(preset)}
                    style={{ cursor: 'pointer', userSelect: 'none' } as never}
                  >
                    <Stack
                      paddingVertical="$2"
                      paddingHorizontal="$3"
                      borderRadius="$3"
                      backgroundColor={selectedPreset.label === preset.label ? '$primary' : '$backgroundHover'}
                      borderWidth={1}
                      borderColor={selectedPreset.label === preset.label ? '$primary' : 'transparent'}
                    >
                      <Text
                        fontSize={14}
                        fontWeight="600"
                        color={selectedPreset.label === preset.label ? 'white' : '$color'}
                      >
                        {preset.label}
                      </Text>
                    </Stack>
                  </Pressable>
                ))}
              </XStack>
            </YStack>

            {/* Pyramid Section */}
            <YStack gap="$2">
              <Text fontSize={12} fontWeight="600" color="$textMuted">
                Pyramid
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {PYRAMID_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.label}
                    onPress={() => setSelectedPreset(preset)}
                    style={{ cursor: 'pointer', userSelect: 'none' } as never}
                  >
                    <Stack
                      paddingVertical="$2"
                      paddingHorizontal="$3"
                      borderRadius="$3"
                      backgroundColor={selectedPreset.label === preset.label ? '$primary' : '$backgroundHover'}
                      borderWidth={1}
                      borderColor={selectedPreset.label === preset.label ? '$primary' : 'transparent'}
                    >
                      <Text
                        fontSize={14}
                        fontWeight="600"
                        color={selectedPreset.label === preset.label ? 'white' : '$color'}
                      >
                        {preset.label}
                      </Text>
                    </Stack>
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          </YStack>

          <Button
            variant="primary"
            fullWidth
            size="large"
            loading={createSubject.isPending}
            onPress={handleSubmit(onSubmit)}
          >
            Create Workout
          </Button>
        </YStack>
      </YStack>
    </Modal>
  );
}
