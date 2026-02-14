import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { Stack, Text, useTheme } from '@tamagui/core';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helperText, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const theme = useTheme();

    const bgColor = theme.background?.val ?? '#09090B';
    const textColor = theme.color?.val ?? '#FAFAFA';
    const borderDefault = theme.borderColor?.val ?? '#27272A';
    const borderFocus = theme.primary?.val ?? '#8B5CF6';
    const borderError = theme.error?.val ?? '#EF4444';
    const placeholderColor = theme.textMuted?.val ?? '#71717A';
    const labelColor = theme.textSecondary?.val ?? '#A1A1AA';

    const currentBorder = error
      ? borderError
      : focused
        ? borderFocus
        : borderDefault;

    return (
      <Stack gap={6}>
        {label && (
          <Text
            fontSize={13}
            fontWeight="500"
            color={labelColor}
          >
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          style={[
            {
              ...(props.multiline ? { minHeight: 48 } : { height: 48 }),
              borderRadius: 8,
              borderWidth: focused ? 2 : 1,
              borderColor: currentBorder,
              backgroundColor: bgColor,
              paddingHorizontal: 16,
              fontSize: 16,
              color: textColor,
            },
            style,
          ]}
          placeholderTextColor={placeholderColor}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {error && (
          <Text fontSize={12} color={borderError}>
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text fontSize={12} color={labelColor}>
            {helperText}
          </Text>
        )}
      </Stack>
    );
  }
);

Input.displayName = 'Input';
