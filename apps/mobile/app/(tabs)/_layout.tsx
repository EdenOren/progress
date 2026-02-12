import React, { useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useColorScheme, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useModule, useSupabaseContext } from '../../src/providers';
import { ModuleSelectorSheet, LoadingScreen } from '../../src/components';

function HeaderTitle(): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { currentModule, enabledModules, setModule } = useModule();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

  const titleText = currentModule === 'daily_log' ? 'Daily Log' : 'Workouts';
  const textColor = isDark ? '#FAFAFA' : '#18181B';

  // Only show dropdown if there are multiple enabled modules
  const hasMultipleModules = enabledModules.length > 1;

  const handlePress = (): void => {
    if (hasMultipleModules) {
      setSheetOpen(true);
    }
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={!hasMultipleModules}
        style={{ cursor: hasMultipleModules ? 'pointer' : 'default', userSelect: 'none' } as never}
      >
        <XStack alignItems="center" gap={4}>
          <Text
            fontSize={17}
            fontWeight="600"
            color={textColor}
          >
            {titleText}
          </Text>
          {hasMultipleModules && (
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={textColor}
            />
          )}
        </XStack>
      </Pressable>

      <ModuleSelectorSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelectModule={setModule}
        currentModule={currentModule}
        enabledModules={enabledModules}
      />
    </>
  );
}

export default function TabsLayout(): React.ReactElement {
  const { session, isLoading } = useSupabaseContext();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const { currentModule } = useModule();

  // Auth guard: Redirect to login if not authenticated (prevents deep-link bypass)
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const homeIcon = currentModule === 'daily_log' ? 'calendar-check' : 'dumbbell';
  const tabLabel = currentModule === 'daily_log' ? 'Daily Log' : 'Workouts';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? '#09090B' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FAFAFA' : '#18181B',
        tabBarStyle: {
          backgroundColor: isDark ? '#18181B' : '#FFFFFF',
          borderTopColor: isDark ? '#27272A' : '#E4E4E7',
          borderTopWidth: 1,
          height: 60,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: isDark ? '#71717A' : '#A1A1AA',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle />,
          tabBarLabel: tabLabel,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name={homeIcon}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="menu"
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Detail screens - hidden from tab bar but keep tabs visible */}
      <Tabs.Screen
        name="subject/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
