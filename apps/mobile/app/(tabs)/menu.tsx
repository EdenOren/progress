import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSupabaseContext, useModule, type ModuleType } from '../../src/providers';
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
      style={{ cursor: 'pointer', userSelect: 'none' } as never}
    >
      <XStack
        backgroundColor="$backgroundHover"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius="$3"
        alignItems="center"
        gap="$3"
        hoverStyle={{ opacity: 0.8 }}
        pressStyle={{ opacity: 0.7 }}
      >
        <Stack
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={color ? `${color}20` : '$blue5'}
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

interface ModuleRowProps {
  icon: string;
  label: string;
  moduleKey: ModuleType;
  currentModule: ModuleType;
  onSelect: (module: ModuleType) => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function ModuleRow({
  icon,
  label,
  moduleKey,
  currentModule,
  onSelect,
  disabled,
  comingSoon,
}: ModuleRowProps): React.ReactElement {
  const theme = useTheme();
  const isSelected = currentModule === moduleKey;

  return (
    <Pressable
      onPress={() => !disabled && onSelect(moduleKey)}
      disabled={disabled}
      style={{ cursor: disabled ? 'default' : 'pointer', userSelect: 'none' } as never}
    >
      <XStack
        backgroundColor="$backgroundHover"
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius="$3"
        alignItems="center"
        gap="$3"
        opacity={disabled ? 0.5 : 1}
        borderWidth={isSelected ? 2 : 0}
        borderColor={isSelected ? '$primary' : 'transparent'}
        hoverStyle={disabled ? {} : { opacity: 0.8 }}
        pressStyle={disabled ? {} : { opacity: 0.7 }}
      >
        <Stack
          width={36}
          height={36}
          borderRadius={18}
          backgroundColor={isSelected ? '$primary' : '$backgroundPress'}
          alignItems="center"
          justifyContent="center"
        >
          <MaterialCommunityIcons
            name={icon as never}
            size={20}
            color={isSelected ? 'white' : theme.textMuted?.val ?? '#71717A'}
          />
        </Stack>
        <Text flex={1} fontSize={16} color={disabled ? '$textMuted' : '$color'}>
          {label}
        </Text>
        {comingSoon ? (
          <Stack backgroundColor="$backgroundPress" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
            <Text fontSize={11} color="$textMuted">
              Coming Soon
            </Text>
          </Stack>
        ) : isSelected ? (
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={theme.primary?.val ?? '#8B5CF6'}
          />
        ) : null}
      </XStack>
    </Pressable>
  );
}

export default function MenuScreen(): React.ReactElement {
  const { user } = useSupabaseContext();
  const { signOut } = useAuth();
  const { currentModule, setModule } = useModule();
  const theme = useTheme();

  const handleSignOut = async (): Promise<void> => {
    const result = await signOut();
    if (result.success) {
      router.replace('/(auth)/login');
    }
  };

  const handleModuleSelect = (module: ModuleType): void => {
    setModule(module);
    router.navigate('/(tabs)');
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
          style={{ cursor: 'pointer', userSelect: 'none' } as never}
        >
          <XStack
            backgroundColor="$backgroundHover"
            padding="$4"
            borderRadius="$3"
            alignItems="center"
            gap="$3"
            hoverStyle={{ opacity: 0.8 }}
            pressStyle={{ opacity: 0.7 }}
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
              <Text fontSize={14} color="$textMuted">
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

        {/* Modules Section */}
        <YStack gap="$3">
          <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase" marginLeft="$2">
            Modules
          </Text>
          <YStack gap="$2">
            <ModuleRow
              icon="dumbbell"
              label="Workout"
              moduleKey="workout"
              currentModule={currentModule}
              onSelect={handleModuleSelect}
            />
            <ModuleRow
              icon="sleep"
              label="Sleep"
              moduleKey="sleep"
              currentModule={currentModule}
              onSelect={handleModuleSelect}
            />
            <ModuleRow
              icon="food-apple-outline"
              label="Nutrition"
              moduleKey={'nutrition' as ModuleType}
              currentModule={currentModule}
              onSelect={() => {}}
              disabled
              comingSoon
            />
          </YStack>
        </YStack>

        {/* Settings Section */}
        <YStack gap="$3">
          <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase" marginLeft="$2">
            App
          </Text>
          <YStack gap="$2">
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
            style={{ cursor: 'pointer', userSelect: 'none' } as never}
          >
            <XStack
              backgroundColor="rgba(239, 68, 68, 0.1)"
              paddingHorizontal="$4"
              paddingVertical="$3"
              borderRadius="$3"
              alignItems="center"
              justifyContent="center"
              gap="$2"
              hoverStyle={{ opacity: 0.8 }}
              pressStyle={{ opacity: 0.7 }}
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
