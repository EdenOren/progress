import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabsLayout(): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

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
        },
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: isDark ? '#71717A' : '#A1A1AA',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Workouts',
          tabBarLabel: 'Workouts',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
