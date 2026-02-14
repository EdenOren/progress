import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSupabaseContext } from '../../src/providers';
import { useAuth } from '../../src/hooks';

interface MenuRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

function MenuRow({ icon, label, onPress, rightElement, color }: MenuRowProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ cursor: 'pointer', userSelect: 'none', opacity: pressed ? 0.7 : 1 } as never)}
    >
      <XStack
        backgroundColor="$backgroundHover"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius="$3"
        alignItems="center"
        gap="$3"
      >
        <Stack
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={color ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.12)` : '$blue5'}
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name={icon as never}
            size={20}
            color={color ?? theme.secondary?.val ?? '#3B82F6'}
          />
        </Stack>
        <Text flex={1} fontSize={16} color="$color">
          {label}
        </Text>
        {rightElement ?? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textMuted?.val ?? '#71717A'}
          />
        )}
      </XStack>
    </Pressable>
  );
}

export default function MenuScreen(): React.ReactElement {
  const { user } = useSupabaseContext();
  const { signOut } = useAuth();
  const theme = useTheme();

  const handleSignOut = async (): Promise<void> => {
    const result = await signOut();
    if (result.success) {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 24 }}
      >
        {/* Profile Section */}
        <Pressable
          onPress={() => router.push('/profile')}
          style={({ pressed }) => ({ cursor: 'pointer', userSelect: 'none', opacity: pressed ? 0.7 : 1 } as never)}
        >
          <XStack
            backgroundColor="$backgroundHover"
            padding="$4"
            borderRadius="$3"
            alignItems="center"
            gap="$3"
          >
            <Stack
              width={56}
              height={56}
              borderRadius={28}
              backgroundColor="$primary"
              justifyContent="center"
              alignItems="center"
            >
              <Text fontSize={24} fontWeight="700" color="white">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </Text>
            </Stack>
            <YStack flex={1}>
              <Text fontSize={18} fontWeight="600" color="$color">
                {user?.user_metadata?.['display_name'] ?? 'User'}
              </Text>
              <Text fontSize={14} color="$textMuted" numberOfLines={1}>
                {user?.email}
              </Text>
            </YStack>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.textMuted?.val ?? '#71717A'}
            />
          </XStack>
        </Pressable>

        {/* Settings Section */}
        <YStack gap="$3">
          <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase" marginLeft="$2">
            App
          </Text>
          <YStack gap="$2">
            <MenuRow
              icon="target"
              label="Goals"
              onPress={() => router.push('/goals')}
              color="#8B5CF6"
            />
            <MenuRow
              icon="cog-outline"
              label="Settings"
              onPress={() => router.push('/settings')}
            />
          </YStack>
        </YStack>

        {/* Sign Out */}
        <YStack paddingTop="$4">
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({ cursor: 'pointer', userSelect: 'none', opacity: pressed ? 0.7 : 1 } as never)}
          >
            <XStack
              backgroundColor="rgba(239, 68, 68, 0.1)"
              paddingHorizontal="$4"
              paddingVertical="$3"
              borderRadius="$3"
              alignItems="center"
              justifyContent="center"
              gap="$2"
            >
              <MaterialCommunityIcons
                name="logout"
                size={20}
                color={theme.error?.val ?? '#EF4444'}
              />
              <Text fontSize={16} fontWeight="600" color="$error">
                Sign Out
              </Text>
            </XStack>
          </Pressable>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
