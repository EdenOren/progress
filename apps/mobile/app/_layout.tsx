import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';
import { AppProviders } from '../src/providers';

export default function RootLayout(): React.ReactElement {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';

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
