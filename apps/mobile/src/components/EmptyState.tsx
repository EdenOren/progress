import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
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
      padding="$6"
      gap="$3"
    >
      <Text fontSize="$6" fontWeight="600" color="$color" textAlign="center">
        {title}
      </Text>
      <Text fontSize="$3" color="$placeholderColor" textAlign="center">
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button variant="primary" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </YStack>
  );
}
