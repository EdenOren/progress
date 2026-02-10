import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';
import { MODULE_INFO, type ModuleKey } from '@progress/shared';
import { useUserSettings, useToggleModule } from '../../src/hooks';
import { ModuleSelector } from '../../src/components/ModuleSelector';
import { SettingsRow } from '../../src/components/SettingsRow';

export default function SettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const router = useRouter();

  const { data: settings, isLoading, error } = useUserSettings();
  const toggleModuleMutation = useToggleModule();

  const handleToggleModule = (moduleKey: ModuleKey, enabled: boolean) => {
    toggleModuleMutation.mutate({ moduleKey, enabled });
  };

  const handleModulePress = (moduleKey: ModuleKey) => {
    if (moduleKey === 'workout') {
      router.push('./workout');
    } else if (moduleKey === 'daily_log') {
      router.push('./daily-log');
    }
  };

  // Get enabled modules that are available
  const enabledAvailableModules = MODULE_INFO.filter(
    (m) => m.isAvailable && settings?.enabled_modules.includes(m.key)
  );

  if (isLoading) {
    return (
      <>
        <RouterStack.Screen
          options={{
            title: 'Settings',
            headerBackTitle: 'Menu',
          }}
        />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.background?.val }}
          edges={['bottom']}
        >
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color={theme.primary?.val} />
          </YStack>
        </SafeAreaView>
      </>
    );
  }

  if (error) {
    return (
      <>
        <RouterStack.Screen
          options={{
            title: 'Settings',
            headerBackTitle: 'Menu',
          }}
        />
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.background?.val }}
          edges={['bottom']}
        >
          <YStack flex={1} justifyContent="center" alignItems="center" padding={16}>
            <Text color="$error" textAlign="center">
              Failed to load settings
            </Text>
          </YStack>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <RouterStack.Screen
        options={{
          title: 'Settings',
          headerBackTitle: 'Menu',
        }}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.background?.val }}
        edges={['bottom']}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Module Selection Section */}
          <YStack gap={12}>
            <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
              Select Modules
            </Text>
            <ModuleSelector
              modules={MODULE_INFO}
              enabledModules={settings?.enabled_modules ?? []}
              onToggle={handleToggleModule}
              disabled={toggleModuleMutation.isPending}
            />
          </YStack>

          {/* Enabled Modules Section */}
          {enabledAvailableModules.length > 0 && (
            <YStack gap={12}>
              <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
                Your Modules
              </Text>
              <YStack gap={8}>
                {enabledAvailableModules.map((module) => (
                  <SettingsRow
                    key={module.key}
                    icon={module.icon as 'dumbbell'}
                    label={module.name}
                    onPress={() => handleModulePress(module.key)}
                  />
                ))}
              </YStack>
            </YStack>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
