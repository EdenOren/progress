import React, { useState } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { XStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModule, useSupabaseContext } from '../../src/providers';
import { useAppColorScheme } from '../../src/hooks/useAppColorScheme';
import { ModuleSelectorSheet, LoadingScreen } from '../../src/components';

function HeaderTitle(): React.ReactElement {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { currentModule, enabledModules, setModule } = useModule();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

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
        hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
        style={({ pressed }) => ({
          opacity: pressed && hasMultipleModules ? 0.7 : 1,
          ...Platform.select({
            // Web-only CSS properties not present in React Native's ViewStyle
            web: { cursor: hasMultipleModules ? 'pointer' : 'default', userSelect: 'none' } as object,
            default: {},
          }),
        })}
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
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  const { currentModule } = useModule();
  const insets = useSafeAreaInsets();

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
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 8 + insets.bottom,
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
