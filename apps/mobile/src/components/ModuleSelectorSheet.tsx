import React from 'react';
import { Modal, Pressable } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ModuleKey } from '@progress/shared';
import { MODULE_INFO } from '@progress/shared';

interface ModuleSelectorSheetProps {
  open: boolean;
  onClose: () => void;
  onSelectModule: (moduleKey: ModuleKey) => void;
  currentModule: ModuleKey;
  enabledModules: ModuleKey[];
  isLoading?: boolean;
}

export function ModuleSelectorSheet({
  open,
  onClose,
  onSelectModule,
  currentModule,
  enabledModules,
  isLoading = false,
}: ModuleSelectorSheetProps): React.ReactElement {
  const theme = useTheme();

  const handleSelect = (moduleKey: ModuleKey): void => {
    if (moduleKey !== currentModule) {
      onSelectModule(moduleKey);
    }
    onClose();
  };

  // Filter modules to only show enabled ones
  const availableModules = MODULE_INFO.filter(
    (module) => enabledModules.includes(module.key)
  );

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          justifyContent="space-between"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Stack width={60} />
          <Text fontWeight="700" fontSize={17}>Select Module</Text>
          <Pressable
            onPress={onClose}
            style={{ cursor: 'pointer', userSelect: 'none', width: 60, alignItems: 'flex-end' } as never}
          >
            <Text fontSize={16} fontWeight="600" color="$primary">
              Done
            </Text>
          </Pressable>
        </XStack>

        {/* Module list */}
        <YStack flex={1} padding="$4" gap="$3">
          {availableModules.map((module) => {
            const isSelected = currentModule === module.key;

            return (
              <Pressable
                key={module.key}
                onPress={() => handleSelect(module.key)}
                disabled={isLoading}
                style={{ cursor: 'pointer', userSelect: 'none', opacity: isLoading ? 0.5 : 1 } as never}
              >
                <XStack
                  backgroundColor="$backgroundHover"
                  paddingHorizontal="$4"
                  paddingVertical="$4"
                  borderRadius="$4"
                  alignItems="center"
                  gap="$3"
                  borderWidth={isSelected ? 2 : 1}
                  borderColor={isSelected ? '$primary' : '$borderColor'}
                  hoverStyle={{ opacity: 0.8 }}
                  pressStyle={{ opacity: 0.7 }}
                >
                  {/* Icon */}
                  <Stack
                    width={44}
                    height={44}
                    borderRadius={22}
                    backgroundColor={isSelected ? '$primary' : '$backgroundPress'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <MaterialCommunityIcons
                      name={module.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={24}
                      color={isSelected ? '#FFFFFF' : (theme.textMuted?.val ?? '#71717A')}
                    />
                  </Stack>

                  {/* Text */}
                  <YStack flex={1} gap="$0.5">
                    <Text fontSize={17} fontWeight="600" color={isSelected ? '$color' : '$color'}>
                      {module.name}
                    </Text>
                    <Text fontSize={13} color="$textMuted" numberOfLines={1}>
                      {module.description}
                    </Text>
                  </YStack>

                  {/* Checkmark */}
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color={theme.primary?.val ?? '#8B5CF6'}
                    />
                  )}
                </XStack>
              </Pressable>
            );
          })}

          {/* Hint text */}
          <Text fontSize={13} color="$textMuted" textAlign="center" marginTop="$2">
            Enable more modules in Settings
          </Text>
        </YStack>
      </YStack>
    </Modal>
  );
}
