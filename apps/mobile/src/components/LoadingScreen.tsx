import React from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps): React.ReactElement {
  const theme = useTheme();

  return (
    <YStack
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
    >
      <ActivityIndicator size="large" color={theme.primary?.val ?? '#8B5CF6'} />
      {message && (
        <Text marginTop={16} fontSize={14} color="$textSecondary">
          {message}
        </Text>
      )}
    </YStack>
  );
}
