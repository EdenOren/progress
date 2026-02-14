import React from 'react';
import { I18nManager, Platform, UIManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AppProviders } from '../src/providers';
import { useAppColorScheme } from '../src/hooks/useAppColorScheme';
import { useOTAUpdates } from '../src/hooks/useOTAUpdates';

// Force LTR layout on all devices (prevents RTL mirroring on Arabic/Hebrew locales)
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

// Enable LayoutAnimation on Android (called once globally)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function RootLayout(): React.ReactElement {
  useOTAUpdates();
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
