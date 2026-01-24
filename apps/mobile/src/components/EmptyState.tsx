import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, Stack } from '@tamagui/core';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding={32}
      gap={16}
    >
      <Stack
        width={64}
        height={64}
        borderRadius={32}
        backgroundColor="$surfaceHover"
        justifyContent="center"
        alignItems="center"
        marginBottom={8}
      >
        <Text fontSize={28} color="$textMuted">
          +
        </Text>
      </Stack>
      <Text fontSize={22} fontWeight="600" color="$color" textAlign="center">
        {title}
      </Text>
      <Text fontSize={16} color="$textSecondary" textAlign="center">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Stack marginTop={8} width="100%">
          <Button variant="primary" fullWidth onPress={onAction}>
            {actionLabel}
          </Button>
        </Stack>
      )}
    </YStack>
  );
}
