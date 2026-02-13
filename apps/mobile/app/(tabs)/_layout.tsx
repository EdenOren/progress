import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSupabaseContext } from '../../src/providers';
import { useAppColorScheme } from '../../src/hooks/useAppColorScheme';
import { LoadingScreen } from '../../src/components';

export default function TabsLayout(): React.ReactElement {
  const { session, isLoading } = useSupabaseContext();
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Auth guard: Redirect to login if not authenticated (prevents deep-link bypass)
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

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
          title: 'Progress',
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="kpi"
        options={{
          title: 'KPI',
          tabBarLabel: 'KPI',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
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
