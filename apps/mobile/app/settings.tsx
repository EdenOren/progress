import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen(): React.ReactElement {
  const theme = useTheme();

  return (
    <>
      <RouterStack.Screen
        options={{
          title: 'Settings',
          headerBackTitle: 'Menu',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
        <YStack flex={1} justifyContent="center" alignItems="center" padding={16} gap={16}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={64}
            color={theme.textMuted?.val ?? '#71717A'}
          />
          <Text fontSize={20} fontWeight="600" color="$color">
            Settings
          </Text>
          <Text fontSize={14} color="$textMuted" textAlign="center">
            App settings will appear here in a future update.
          </Text>
        </YStack>
      </SafeAreaView>
    </>
  );
}
