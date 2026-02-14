import React, { useState, useEffect } from 'react';
import { TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button } from '../src/components';
import { useHealthGoals, useUpsertHealthGoals, useUserSettings } from '../src/hooks';
import { DEFAULT_DAILY_LOG_SETTINGS } from '@progress/shared';
import { showSuccessToast, showErrorToast, getErrorMessage } from '../src/utils';

export default function GoalsScreen(): React.ReactElement {
  const theme = useTheme();
  const { data: goals, isLoading } = useHealthGoals();
  const upsertGoals = useUpsertHealthGoals();
  const { data: settings } = useUserSettings();
  const weightUnit = settings?.module_settings.daily_log?.weight_unit ?? DEFAULT_DAILY_LOG_SETTINGS.weight_unit;

  const [sleepTarget, setSleepTarget] = useState('');
  const [waterTarget, setWaterTarget] = useState('');
  const [weightTarget, setWeightTarget] = useState('');
  const [waistTarget, setWaistTarget] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Populate form when goals load
  useEffect(() => {
    if (goals) {
      setSleepTarget(goals.sleep_target_hours?.toString() ?? '');
      setWaterTarget(goals.water_target_liters?.toString() ?? '');
      setWeightTarget(goals.weight_target_kg?.toString() ?? '');
      setWaistTarget(goals.waist_target_cm?.toString() ?? '');
      setHasChanges(false);
    }
  }, [goals]);

  const handleChange = (setter: (val: string) => void) => (value: string): void => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    try {
      await upsertGoals.mutateAsync({
        sleep_target_hours: sleepTarget ? parseFloat(sleepTarget) : null,
        water_target_liters: waterTarget ? parseFloat(waterTarget) : null,
        weight_target_kg: weightTarget ? parseFloat(weightTarget) : null,
        waist_target_cm: waistTarget ? parseFloat(waistTarget) : null,
      });
      showSuccessToast('Goals saved');
      setHasChanges(false);
    } catch (e) {
      showErrorToast(getErrorMessage(e));
    }
  };

  const inputStyle = {
    width: 100,
    backgroundColor: theme.backgroundHover?.val ?? '#27272A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.color?.val ?? '#FAFAFA',
    textAlign: 'right' as const,
  };

  return (
    <>
      <RouterStack.Screen
        options={{
          title: 'Goals',
          headerShown: true,
          headerBackTitle: 'Menu',
          headerStyle: { backgroundColor: theme.background?.val },
          headerTintColor: theme.color?.val,
          headerTitleStyle: { color: theme.color?.val },
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }} edges={['bottom']}>
        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color={theme.primary?.val} />
          </YStack>
        ) : (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info Banner */}
              <XStack
                backgroundColor="rgba(139, 92, 246, 0.1)"
                padding={14}
                borderRadius={12}
                gap={12}
                alignItems="center"
              >
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color={theme.primary?.val ?? '#8B5CF6'}
                />
                <Text flex={1} fontSize={13} color="$color">
                  Set your health targets. These are used to calculate KPI percentages.
                </Text>
              </XStack>

              <Card>
                <YStack gap={20}>
                  {/* Sleep Target */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={8} flex={1}>
                      <MaterialCommunityIcons
                        name="sleep"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Sleep Target
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="8.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setSleepTarget)}
                        value={sleepTarget}
                        maxLength={4}
                      />
                      <Text fontSize={13} color="$textMuted" width={55}>hrs/night</Text>
                    </XStack>
                  </XStack>

                  {/* Water Target */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={8} flex={1}>
                      <MaterialCommunityIcons
                        name="water"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Water Target
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="2.5"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setWaterTarget)}
                        value={waterTarget}
                        maxLength={4}
                      />
                      <Text fontSize={13} color="$textMuted" width={55}>L/day</Text>
                    </XStack>
                  </XStack>

                  {/* Weight Target */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={8} flex={1}>
                      <MaterialCommunityIcons
                        name="scale-bathroom"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Weight Target
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="75.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setWeightTarget)}
                        value={weightTarget}
                        maxLength={5}
                      />
                      <Text fontSize={13} color="$textMuted" width={55}>{weightUnit}</Text>
                    </XStack>
                  </XStack>

                  {/* Waist Target */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap={8} flex={1}>
                      <MaterialCommunityIcons
                        name="tape-measure"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Waist Target
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="80.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setWaistTarget)}
                        value={waistTarget}
                        maxLength={5}
                      />
                      <Text fontSize={13} color="$textMuted" width={55}>cm</Text>
                    </XStack>
                  </XStack>
                </YStack>
              </Card>

              {/* Save Button */}
              {hasChanges && (
                <Button
                  variant="primary"
                  fullWidth
                  size="large"
                  loading={upsertGoals.isPending}
                  onPress={handleSave}
                >
                  Save Goals
                </Button>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </>
  );
}
