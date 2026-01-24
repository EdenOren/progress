import React from 'react';
import { Stack, useTheme } from '@tamagui/core';

interface CardProps {
  children: React.ReactNode;
  pressable?: boolean;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, pressable, onPress, padding }: CardProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Stack
      backgroundColor={theme.surface?.val ?? '#18181B'}
      borderRadius={12}
      padding={padding ?? 16}
      borderWidth={1}
      borderColor={theme.borderColor?.val ?? '#27272A'}
      onPress={pressable && onPress ? onPress : undefined}
      pressStyle={pressable ? {
        backgroundColor: theme.surfaceHover?.val ?? '#27272A',
        scale: 0.98,
      } : undefined}
    >
      {children}
    </Stack>
  );
}
