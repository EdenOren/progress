import React from 'react';
import { XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

interface SettingsRowProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  disabled?: boolean;
}

export function SettingsRow({
  icon,
  label,
  onPress,
  rightElement,
  showChevron = true,
  disabled = false,
}: SettingsRowProps): React.ReactElement {
  const theme = useTheme();

  const content = (
    <XStack
      backgroundColor={theme.surface?.val ?? '#18181B'}
      borderRadius={12}
      padding={16}
      borderWidth={1}
      borderColor={theme.borderColor?.val ?? '#27272A'}
      alignItems="center"
      gap={12}
      opacity={disabled ? 0.5 : 1}
    >
      {/* Icon */}
      <XStack
        width={40}
        height={40}
        borderRadius={10}
        backgroundColor={theme.surfaceHover?.val ?? '#27272A'}
        alignItems="center"
        justifyContent="center"
      >
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={theme.primary?.val ?? '#8B5CF6'}
        />
      </XStack>

      {/* Label */}
      <Text flex={1} fontSize={16} fontWeight="500" color="$color">
        {label}
      </Text>

      {/* Right element or chevron */}
      {rightElement}
      {showChevron && !rightElement && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={theme.textMuted?.val ?? '#71717A'}
        />
      )}
    </XStack>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
