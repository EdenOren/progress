import React from 'react';
import { Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  formatRelativeDate,
  isToday,
  kgToLbs,
  DEFAULT_DAILY_LOG_SETTINGS,
  type DailyLogEntry,
  type WeightUnit,
} from '@progress/shared';

interface DailyLogEntryCardProps {
  entry: DailyLogEntry;
  onPress: () => void;
  weightUnit?: WeightUnit;
}

function formatSleepHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DailyLogEntryCard({
  entry,
  onPress,
  weightUnit = DEFAULT_DAILY_LOG_SETTINGS.weight_unit,
}: DailyLogEntryCardProps): React.ReactElement {
  const theme = useTheme();
  const isEntryToday = isToday(entry.logged_date);

  // Format weight based on user's preferred unit
  const formatWeightDisplay = (kg: number): string => {
    if (weightUnit === 'lbs') {
      return `${kgToLbs(kg).toFixed(1)} lbs`;
    }
    return `${kg.toFixed(1)} kg`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ cursor: 'pointer', userSelect: 'none', opacity: pressed ? 0.7 : 1 }) as never}
    >
      <YStack
        backgroundColor="$backgroundHover"
        borderRadius="$3"
        padding="$3"
        gap="$2"
        borderLeftWidth={isEntryToday ? 3 : 0}
        borderLeftColor="$primary"
      >
        {/* Date header */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize={14} fontWeight="600" color="$color">
            {isEntryToday ? 'Today' : formatRelativeDate(entry.logged_date)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textMuted?.val ?? '#71717A'}
          />
        </XStack>

        {/* Metrics row */}
        <XStack gap="$4" flexWrap="wrap">
          {/* Sleep */}
          {entry.sleep_hours !== null && (
            <XStack alignItems="center" gap="$1.5">
              <Stack
                width={28}
                height={28}
                borderRadius={14}
                backgroundColor="$purple5"
                justifyContent="center"
                alignItems="center"
              >
                <MaterialCommunityIcons
                  name="sleep"
                  size={14}
                  color={theme.primary?.val ?? '#8B5CF6'}
                />
              </Stack>
              <Text fontSize={15} fontWeight="600" color="$color">
                {formatSleepHours(entry.sleep_hours)}
              </Text>
            </XStack>
          )}

          {/* Weight */}
          {entry.weight_kg !== null && (
            <XStack alignItems="center" gap="$1.5">
              <Stack
                width={28}
                height={28}
                borderRadius={14}
                backgroundColor="$green5"
                justifyContent="center"
                alignItems="center"
              >
                <MaterialCommunityIcons
                  name="scale-bathroom"
                  size={14}
                  color="#10B981"
                />
              </Stack>
              <Text fontSize={15} fontWeight="600" color="$color">
                {formatWeightDisplay(entry.weight_kg)}
              </Text>
            </XStack>
          )}

          {/* Water Intake */}
          {entry.water_intake_liters !== null && (
            <XStack alignItems="center" gap="$1.5">
              <Stack
                width={28}
                height={28}
                borderRadius={14}
                backgroundColor="$blue5"
                justifyContent="center"
                alignItems="center"
              >
                <MaterialCommunityIcons
                  name="water"
                  size={14}
                  color="#3B82F6"
                />
              </Stack>
              <Text fontSize={15} fontWeight="600" color="$color">
                {entry.water_intake_liters} L
              </Text>
            </XStack>
          )}

          {/* Waist */}
          {entry.waist_cm !== null && (
            <XStack alignItems="center" gap="$1.5">
              <Stack
                width={28}
                height={28}
                borderRadius={14}
                backgroundColor="$orange5"
                justifyContent="center"
                alignItems="center"
              >
                <MaterialCommunityIcons
                  name="tape-measure"
                  size={14}
                  color="#F97316"
                />
              </Stack>
              <Text fontSize={15} fontWeight="600" color="$color">
                {entry.waist_cm} cm
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Notes preview */}
        {entry.notes && (
          <Text fontSize={13} color="$textMuted" numberOfLines={1}>
            {entry.notes}
          </Text>
        )}
      </YStack>
    </Pressable>
  );
}
