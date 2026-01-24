import React, { useState } from 'react';
import { Modal } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateSubject } from '../hooks';
import { getErrorMessage } from '../utils';
import { Button } from './Button';
import { Input } from './Input';

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
