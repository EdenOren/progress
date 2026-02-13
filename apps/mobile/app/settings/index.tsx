import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';
import {
  DEFAULT_WORKOUT_SETTINGS,
  DEFAULT_DAILY_LOG_SETTINGS,
  type DistanceUnit,
  type WeightUnit,
} from '@progress/shared';
import {
  useUserSettings,
  useUpdateWorkoutSettings,
  useUpdateDailyLogSettings,
} from '../../src/hooks';
import { UnitToggle } from '../../src/components/UnitToggle';

const DISTANCE_OPTIONS: { value: DistanceUnit; label: string }[] = [
  { value: 'km', label: 'km' },
  { value: 'miles', label: 'miles' },
];

const WEIGHT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
];

export default function SettingsScreen(): React.ReactElement {
  const theme = useTheme();

  const { data: settings, isLoading, error } = useUserSettings();
  const updateWorkoutSettings = useUpdateWorkoutSettings();
  const updateDailyLogSettings = useUpdateDailyLogSettings();

  const workoutSettings = settings?.module_settings.workout ?? DEFAULT_WORKOUT_SETTINGS;
  const dailyLogSettings = settings?.module_settings.daily_log ?? DEFAULT_DAILY_LOG_SETTINGS;

  const isPending = updateWorkoutSettings.isPending || updateDailyLogSettings.isPending;

  if (isLoading) {
    return (
      <>
        <RouterStack.Screen
          options={{ title: 'Settings', headerBackTitle: 'Menu' }}
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
          options={{ title: 'Settings', headerBackTitle: 'Menu' }}
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
        options={{ title: 'Settings', headerBackTitle: 'Menu' }}
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
          {/* Workout Section */}
          <YStack gap={12}>
            <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
              Workout
            </Text>
            <YStack gap={8}>
              <UnitToggle
                label="Weight Unit"
                options={WEIGHT_OPTIONS}
                value={workoutSettings.weight_unit}
                onChange={(value: WeightUnit) =>
                  updateWorkoutSettings.mutate({ weight_unit: value })
                }
                disabled={isPending}
              />
              <UnitToggle
                label="Distance Unit"
                options={DISTANCE_OPTIONS}
                value={workoutSettings.distance_unit}
                onChange={(value: DistanceUnit) =>
                  updateWorkoutSettings.mutate({ distance_unit: value })
                }
                disabled={isPending}
              />
            </YStack>
          </YStack>

          {/* Daily Log Section */}
          <YStack gap={12}>
            <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
              Daily Log
            </Text>
            <YStack gap={8}>
              <UnitToggle
                label="Weight Unit"
                options={WEIGHT_OPTIONS}
                value={dailyLogSettings.weight_unit}
                onChange={(value: WeightUnit) =>
                  updateDailyLogSettings.mutate({ weight_unit: value })
                }
                disabled={isPending}
              />
            </YStack>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
