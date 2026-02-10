import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';
import {
  DEFAULT_DAILY_LOG_SETTINGS,
  type WeightUnit,
} from '@progress/shared';
import { useUserSettings, useUpdateDailyLogSettings } from '../../src/hooks';
import { UnitToggle } from '../../src/components/UnitToggle';

const WEIGHT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
];

export default function DailyLogSettingsScreen(): React.ReactElement {
  const theme = useTheme();

  const { data: settings, isLoading, error } = useUserSettings();
  const updateDailyLogSettings = useUpdateDailyLogSettings();

  // Get current daily log settings with defaults
  const dailyLogSettings = settings?.module_settings.daily_log ?? DEFAULT_DAILY_LOG_SETTINGS;

  const handleWeightChange = (value: WeightUnit) => {
    updateDailyLogSettings.mutate({ weight_unit: value });
  };

  if (isLoading) {
    return (
      <>
        <RouterStack.Screen
          options={{
            title: 'Daily Log Settings',
            headerBackTitle: 'Settings',
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
            title: 'Daily Log Settings',
            headerBackTitle: 'Settings',
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
          title: 'Daily Log Settings',
          headerBackTitle: 'Settings',
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
          {/* Units Section */}
          <YStack gap={12}>
            <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
              Units
            </Text>
            <YStack gap={8}>
              <UnitToggle
                label="Weight"
                options={WEIGHT_OPTIONS}
                value={dailyLogSettings.weight_unit}
                onChange={handleWeightChange}
                disabled={updateDailyLogSettings.isPending}
              />
            </YStack>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
