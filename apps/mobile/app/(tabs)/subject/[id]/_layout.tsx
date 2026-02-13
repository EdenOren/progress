import React from 'react';
import { Stack } from 'expo-router';
import { useAppColorScheme } from '../../../../src/hooks/useAppColorScheme';

export default function SubjectLayout(): React.ReactElement {
  const colorScheme = useAppColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#09090B' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FAFAFA' : '#18181B',
        contentStyle: {
          backgroundColor: isDark ? '#09090B' : '#FFFFFF',
        },
      }}
    />
  );
}
