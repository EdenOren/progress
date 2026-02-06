import { Stack } from 'expo-router';
import { useTheme } from '@tamagui/core';

export default function SettingsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background?.val ?? '#09090B',
        },
        headerTintColor: theme.color?.val ?? '#FAFAFA',
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: theme.background?.val ?? '#09090B',
        },
      }}
    />
  );
}
