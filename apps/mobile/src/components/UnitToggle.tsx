import React from 'react';
import { XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { Pressable } from 'react-native';

interface UnitToggleProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}

export function UnitToggle<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: UnitToggleProps<T>): React.ReactElement {
  const theme = useTheme();

  return (
    <XStack
      backgroundColor={theme.surface?.val ?? '#18181B'}
      borderRadius={12}
      padding={16}
      borderWidth={1}
      borderColor={theme.borderColor?.val ?? '#27272A'}
      alignItems="center"
      justifyContent="space-between"
      opacity={disabled ? 0.5 : 1}
    >
      <Text fontSize={16} fontWeight="500" color="$color">
        {label}
      </Text>

      <XStack
        backgroundColor={theme.surfaceHover?.val ?? '#27272A'}
        borderRadius={8}
        padding={4}
        gap={4}
        width={140}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => !disabled && onChange(option.value)}
              disabled={disabled}
              style={({ pressed }) => ({
                flex: 1,
                opacity: pressed && !disabled ? 0.7 : 1,
              })}
            >
              <XStack
                paddingVertical={8}
                borderRadius={6}
                backgroundColor={
                  isSelected ? theme.primary?.val ?? '#8B5CF6' : 'transparent'
                }
                justifyContent="center"
                alignItems="center"
              >
                <Text
                  fontSize={14}
                  fontWeight={isSelected ? '600' : '500'}
                  color={isSelected ? '#FFFFFF' : '$textMuted'}
                  textAlign="center"
                >
                  {option.label}
                </Text>
              </XStack>
            </Pressable>
          );
        })}
      </XStack>
    </XStack>
  );
}
