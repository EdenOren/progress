import React from 'react';
import { View, StyleSheet } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { Card, Button } from '../../src/components';
import { useAuth } from '../../src/hooks';
import { useSupabaseContext } from '../../src/providers';

export default function ProfileScreen(): React.ReactElement {
  const { user } = useSupabaseContext();
  const { signOut } = useAuth();

  const handleSignOut = (): void => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <YStack flex={1} padding="$4" gap="$4">
        <Card>
          <YStack gap="$3">
            <YStack
              width={80}
              height={80}
              borderRadius={40}
              backgroundColor="$primary"
              justifyContent="center"
              alignItems="center"
              alignSelf="center"
            >
              <Text fontSize="$8" fontWeight="700" color="white">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </Text>
            </YStack>

            <YStack alignItems="center" gap="$1">
              <Text fontSize="$5" fontWeight="600" color="$color">
                {user?.user_metadata?.['display_name'] ?? 'User'}
              </Text>
              <Text fontSize="$3" color="$placeholderColor">
                {user?.email}
              </Text>
            </YStack>
          </YStack>
        </Card>

        <Card>
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Account
            </Text>
            <View style={styles.separator} />

            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$color">Email</Text>
              <Text color="$placeholderColor">{user?.email}</Text>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$color">Member since</Text>
              <Text color="$placeholderColor">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : '-'}
              </Text>
            </XStack>
          </YStack>
        </Card>

        <YStack flex={1} />

        <Button variant="danger" fullWidth onPress={handleSignOut}>
          Sign Out
        </Button>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    backgroundColor: '#374151',
  },
});
