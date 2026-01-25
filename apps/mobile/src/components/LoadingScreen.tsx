import React from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack } from '@tamagui/stacks';
import { useTheme } from '@tamagui/core';

export function LoadingScreen(): React.ReactElement {
  const theme = useTheme();

  return (
    <YStack
      flex={1}
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
      backgroundColor="$background"
    >
      <ActivityIndicator
        size="large"
        color={theme.primary?.val ?? '#8B5CF6'}
      />
    </YStack>
  );
}
