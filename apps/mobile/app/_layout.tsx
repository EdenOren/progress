import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { AppProviders } from '../src/providers';

export default function RootLayout(): React.ReactElement {
  const colorScheme = useColorScheme();

  return (
    <AppProviders>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#0a0a0a' : '#ffffff',
          },
        }}
      />
    </AppProviders>
  );
}
