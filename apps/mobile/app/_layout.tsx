import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AppProviders } from '../src/providers';
import { useAppColorScheme } from '../src/hooks/useAppColorScheme';

export default function RootLayout(): React.ReactElement {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <>
      <AppProviders>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: isDark ? '#09090B' : '#FFFFFF',
            },
          }}
        />
      </AppProviders>
      <Toast />
    </>
  );
}
