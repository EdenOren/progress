import React from 'react';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView } from 'react-native';
import { KpiCard } from '../../src/components';
import { useKpi } from '../../src/hooks';

export default function KPIScreen(): React.ReactElement {
  const theme = useTheme();
  const { cards, isLoading } = useKpi();

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.background?.val }}
        edges={['bottom']}
      >
        <YStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={theme.primary?.val ?? '#8B5CF6'} />
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background?.val }}
      edges={['bottom']}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <Text fontSize={13} fontWeight="600" color="$textMuted" textTransform="uppercase">
          Health Snapshot
        </Text>

        {/* 2x2 Grid */}
        <YStack gap={12}>
          <XStack gap={12}>
            <KpiCard
              title={cards[0]!.title}
              value={cards[0]!.value}
              subtitle={cards[0]!.subtitle}
              status={cards[0]!.status}
              icon={cards[0]!.icon}
            />
            <KpiCard
              title={cards[1]!.title}
              value={cards[1]!.value}
              subtitle={cards[1]!.subtitle}
              status={cards[1]!.status}
              icon={cards[1]!.icon}
            />
          </XStack>
          <XStack gap={12}>
            <KpiCard
              title={cards[2]!.title}
              value={cards[2]!.value}
              subtitle={cards[2]!.subtitle}
              status={cards[2]!.status}
              icon={cards[2]!.icon}
            />
            <KpiCard
              title={cards[3]!.title}
              value={cards[3]!.value}
              subtitle={cards[3]!.subtitle}
              status={cards[3]!.status}
              icon={cards[3]!.icon}
            />
          </XStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
