import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack, Text, useTheme } from '@tamagui/core';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  flex?: number;
  backgroundColor?: string;
}

const sizeConfig: Record<ButtonSize, { height: number; px: number; fontSize: number }> = {
  small: { height: 36, px: 16, fontSize: 13 },
  medium: { height: 44, px: 24, fontSize: 15 },
  large: { height: 52, px: 32, fontSize: 16 },
};

export function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  onPress,
  children,
  flex,
  backgroundColor: bgOverride,
}: ButtonProps): React.ReactElement {
  const theme = useTheme();
  const s = sizeConfig[size];
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      bg: theme.primary?.val ?? '#8B5CF6',
      text: '#FFFFFF',
      border: 'transparent',
      pressedBg: theme.primaryDark?.val ?? '#7C3AED',
    },
    secondary: {
      bg: 'transparent',
      text: theme.primary?.val ?? '#8B5CF6',
      border: theme.primary?.val ?? '#8B5CF6',
      pressedBg: 'rgba(139, 92, 246, 0.1)',
    },
    ghost: {
      bg: 'transparent',
      text: theme.primaryLight?.val ?? '#A78BFA',
      border: 'transparent',
      pressedBg: 'rgba(139, 92, 246, 0.1)',
    },
    danger: {
      bg: theme.error?.val ?? '#EF4444',
      text: '#FFFFFF',
      border: 'transparent',
      pressedBg: '#DC2626',
    },
  };

  const v = variantStyles[variant];

  return (
    <Stack
      onPress={isDisabled ? undefined : onPress}
      opacity={isDisabled ? 0.5 : 1}
      height={s.height}
      paddingHorizontal={s.px}
      backgroundColor={bgOverride ?? v.bg}
      borderRadius={8}
      alignItems="center"
      justifyContent="center"
      borderWidth={v.border === 'transparent' ? 0 : 1}
      borderColor={v.border}
      width={fullWidth ? '100%' : undefined}
      flex={flex}
      pressStyle={{
        backgroundColor: v.pressedBg,
        scale: 0.96,
      }}
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      userSelect="none"
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text
          color={v.text}
          fontSize={s.fontSize}
          fontWeight="600"
          userSelect="none"
        >
          {children}
        </Text>
      )}
    </Stack>
  );
}
