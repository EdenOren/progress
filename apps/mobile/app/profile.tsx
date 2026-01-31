import React from 'react';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { Card } from '../src/components';
import { useSupabaseContext } from '../src/providers';

export default function ProfileScreen(): React.ReactElement {
  const { user } = useSupabaseContext();
  const theme = useTheme();

  return (
    <>
      <RouterStack.Screen
        options={{
          title: 'Profile',
          headerBackTitle: 'Menu',
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
        <YStack flex={1} padding={16} gap={16}>
          <Card>
            <YStack gap={16}>
              <Stack
                width={100}
                height={100}
                borderRadius={50}
                backgroundColor="$primary"
                justifyContent="center"
                alignItems="center"
                alignSelf="center"
              >
                <Text fontSize={36} fontWeight="700" color="white">
                  {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                </Text>
              </Stack>

              <YStack alignItems="center" gap={4}>
                <Text fontSize={18} fontWeight="600" color="$color">
                  {user?.user_metadata?.['display_name'] ?? 'User'}
                </Text>
                <Text fontSize={14} color="$textSecondary">
                  {user?.email}
                </Text>
              </YStack>
            </YStack>
          </Card>

          <Card>
            <YStack gap={16}>
              <Text fontSize={16} fontWeight="600" color="$color">
                Account
              </Text>
              <Stack height={1} backgroundColor="$borderColor" />

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={14} color="$color">Email</Text>
                <Text fontSize={14} color="$textSecondary">{user?.email}</Text>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize={14} color="$color">Member since</Text>
                <Text fontSize={14} color="$textSecondary">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : '-'}
                </Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </SafeAreaView>
    </>
  );
}
