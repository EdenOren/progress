import React, { useState } from 'react';
import { Modal } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createItem } from '@progress/shared';
import { useSupabaseContext } from '../providers';
import { getErrorMessage } from '../utils';
import { Button } from './Button';
import { Input } from './Input';

const addItemSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100),
});

type AddItemForm = z.infer<typeof addItemSchema>;

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  entryId: string;
}

export function AddItemModal({
  visible,
  onClose,
  entryId,
}: AddItemModalProps): React.ReactElement {
  const { user } = useSupabaseContext();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddItemForm>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: '',
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');

      // Get current items count for position
      const currentEntry = queryClient.getQueryData<{ items: unknown[] }>([
        'entries',
        'detail',
        entryId,
      ]);
      const position = currentEntry?.items.length ?? 0;

      const result = await createItem({
        entry_id: entryId,
        user_id: user.id,
        name,
        position,
      });

      if (!result.success) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', 'detail', entryId] });
      handleClose();
    },
    onError: (e) => {
      setError(getErrorMessage(e));
    },
  });

  const onSubmit = (data: AddItemForm): void => {
    setError(null);
    addItemMutation.mutate(data.name);
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
            Add Exercise
          </Text>
          <Button variant="ghost" size="small" onPress={handleClose}>
            Cancel
          </Button>
        </XStack>

        {error && (
          <YStack
            marginBottom="$4"
            backgroundColor="$error"
            opacity={0.9}
            padding="$3"
            borderRadius="$3"
          >
            <Text color="white" fontSize="$2">
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
                label="Exercise Name"
                placeholder="e.g., Deadlift, Squats, Bench Press"
                autoFocus
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
              />
            )}
          />

          <Button
            variant="primary"
            fullWidth
            size="large"
            loading={addItemMutation.isPending}
            onPress={handleSubmit(onSubmit)}
          >
            Add Exercise
          </Button>
        </YStack>
      </YStack>
    </Modal>
  );
}
