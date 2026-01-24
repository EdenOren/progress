import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

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

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: '#3b82f6', text: '#ffffff' },
  secondary: { bg: '#1f2937', text: '#f9fafb', border: '#374151' },
  ghost: { bg: 'transparent', text: '#60a5fa' },
  danger: { bg: '#ef4444', text: '#ffffff' },
};

const sizeStyles: Record<ButtonSize, { height: number; px: number; fontSize: number }> = {
  small: { height: 36, px: 12, fontSize: 13 },
  medium: { height: 44, px: 16, fontSize: 15 },
  large: { height: 52, px: 20, fontSize: 16 },
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
  backgroundColor,
}: ButtonProps): React.ReactElement {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          height: s.height,
          paddingHorizontal: s.px,
          backgroundColor: backgroundColor || v.bg,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.6 : pressed ? 0.8 : 1,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
        },
        fullWidth && { width: '100%' },
        flex !== undefined && { flex },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={{ color: v.text, fontSize: s.fontSize, fontWeight: '600' }}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
