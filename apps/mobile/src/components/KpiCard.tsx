import React from 'react';
import { YStack } from '@tamagui/stacks';
import { Text, Stack } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { KpiStatus } from '@progress/shared';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  status: KpiStatus;
  icon: string;
}

const STATUS_COLORS: Record<KpiStatus, string> = {
  good: '#10B981',
  warning: '#F59E0B',
  neutral: '#71717A',
};

export function KpiCard({ title, value, subtitle, status, icon }: KpiCardProps): React.ReactElement {
  const statusColor = STATUS_COLORS[status];

  return (
    <YStack
      flex={1}
      backgroundColor="$backgroundHover"
      borderRadius={16}
      padding={16}
      gap={12}
      borderLeftWidth={3}
      borderLeftColor={statusColor}
    >
      {/* Icon + Title */}
      <Stack
        width={36}
        height={36}
        borderRadius={10}
        backgroundColor={`rgba(${parseInt(statusColor.slice(1, 3), 16)}, ${parseInt(statusColor.slice(3, 5), 16)}, ${parseInt(statusColor.slice(5, 7), 16)}, 0.12)`}
        alignItems="center"
        justifyContent="center"
      >
        <MaterialCommunityIcons
          name={icon as never}
          size={20}
          color={statusColor}
        />
      </Stack>

      {/* Value */}
      <Text
        fontSize={28}
        fontWeight="700"
        color={value === '--' ? '$textMuted' : '$color'}
      >
        {value}
      </Text>

      {/* Title + Subtitle */}
      <YStack gap={2}>
        <Text fontSize={13} fontWeight="600" color="$color">
          {title}
        </Text>
        <Text fontSize={12} color="$textMuted" numberOfLines={1}>
          {subtitle}
        </Text>
      </YStack>
    </YStack>
  );
}
