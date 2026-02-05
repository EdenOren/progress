import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function LoadingScreen(): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background?.val ?? '#09090B' }]}>
      <YStack
        flex={1}
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
      <YStack alignItems="center" gap="$4">
        <YStack
          width={80}
          height={80}
          borderRadius={20}
          backgroundColor="$primary"
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name="chart-line"
            size={40}
            color="#FFFFFF"
          />
        </YStack>
        <Text fontSize={24} fontWeight="700" color="$color">
          Progress
        </Text>
        <ActivityIndicator
          size="small"
          color={theme.primary?.val ?? '#8B5CF6'}
        />
      </YStack>
    </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } as any,
      default: {},
    }),
  },
});
