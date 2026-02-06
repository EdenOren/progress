import React from 'react';
import { XStack, YStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import type { ModuleKey, ModuleInfo } from '@progress/shared';

interface ModuleSelectorProps {
  modules: ModuleInfo[];
  enabledModules: ModuleKey[];
  onToggle: (moduleKey: ModuleKey, enabled: boolean) => void;
  disabled?: boolean;
}

export function ModuleSelector({
  modules,
  enabledModules,
  onToggle,
  disabled = false,
}: ModuleSelectorProps): React.ReactElement {
  const theme = useTheme();

  return (
    <YStack gap={8}>
      {modules.map((module) => {
        const isEnabled = enabledModules.includes(module.key);
        const isAvailable = module.isAvailable;
        const canToggle = isAvailable && !disabled;

        return (
          <Pressable
            key={module.key}
            onPress={() => canToggle && onToggle(module.key, !isEnabled)}
            disabled={!canToggle}
            style={({ pressed }) => ({
              opacity: pressed && canToggle ? 0.7 : 1,
            })}
          >
            <XStack
              backgroundColor={theme.surface?.val ?? '#18181B'}
              borderRadius={12}
              padding={16}
              borderWidth={1}
              borderColor={
                isEnabled
                  ? theme.primary?.val ?? '#8B5CF6'
                  : theme.borderColor?.val ?? '#27272A'
              }
              alignItems="center"
              gap={12}
              opacity={!isAvailable ? 0.5 : 1}
            >
              {/* Checkbox */}
              <XStack
                width={24}
                height={24}
                borderRadius={6}
                borderWidth={2}
                borderColor={
                  isEnabled
                    ? theme.primary?.val ?? '#8B5CF6'
                    : theme.textMuted?.val ?? '#71717A'
                }
                backgroundColor={
                  isEnabled ? theme.primary?.val ?? '#8B5CF6' : 'transparent'
                }
                alignItems="center"
                justifyContent="center"
              >
                {isEnabled && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </XStack>

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
                  name={module.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={22}
                  color={
                    isEnabled
                      ? theme.primary?.val ?? '#8B5CF6'
                      : theme.textMuted?.val ?? '#71717A'
                  }
                />
              </XStack>

              {/* Text */}
              <YStack flex={1} gap={2}>
                <Text
                  fontSize={16}
                  fontWeight="600"
                  color={isEnabled ? '$color' : '$textMuted'}
                >
                  {module.name}
                </Text>
                {!isAvailable && (
                  <Text fontSize={12} color="$textMuted">
                    Coming Soon
                  </Text>
                )}
              </YStack>
            </XStack>
          </Pressable>
        );
      })}
    </YStack>
  );
}
