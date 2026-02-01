import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useModule } from '../../src/providers';

export default function TabsLayout(): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const { currentModule } = useModule();

  const homeTitle = currentModule === 'sleep' ? 'Sleep' : 'Workouts';
  const homeIcon = currentModule === 'sleep' ? 'sleep' : 'dumbbell';

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
          title: homeTitle,
          tabBarLabel: homeTitle,
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
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="entry/[id]"
        options={{
          href: null,
          headerShown: true,
        }}
      />
    </Tabs>
  );
}
