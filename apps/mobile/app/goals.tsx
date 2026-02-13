import React, { useState, useEffect } from 'react';
import { TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button } from '../src/components';
import { useHealthGoals, useUpsertHealthGoals } from '../src/hooks';
import { showSuccessToast } from '../src/utils';

export default function GoalsScreen(): React.ReactElement {
  const theme = useTheme();
  const { data: goals, isLoading } = useHealthGoals();
  const upsertGoals = useUpsertHealthGoals();

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
    await upsertGoals.mutateAsync({
      sleep_target_hours: sleepTarget ? parseFloat(sleepTarget) : null,
      water_target_liters: waterTarget ? parseFloat(waterTarget) : null,
      weight_target_kg: weightTarget ? parseFloat(weightTarget) : null,
      waist_target_cm: waistTarget ? parseFloat(waistTarget) : null,
    });
    showSuccessToast('Goals saved');
    setHasChanges(false);
  };

  const inputStyle = {
    flex: 1,
    backgroundColor: theme.backgroundHover?.val ?? '#27272A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.color?.val ?? '#FAFAFA',
  };

  return (
    <>
      <RouterStack.Screen
        options={{
          title: 'Goals',
          headerBackTitle: 'Menu',
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
                <YStack gap={24}>
                  {/* Sleep Target */}
                  <YStack gap={8}>
                    <XStack alignItems="center" gap={8}>
                      <MaterialCommunityIcons
                        name="sleep"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Sleep Target
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={8}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="8.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setSleepTarget)}
                        value={sleepTarget}
                        maxLength={4}
                      />
                      <Text fontSize={14} color="$textMuted">hrs/night</Text>
                    </XStack>
                  </YStack>

                  {/* Water Target */}
                  <YStack gap={8}>
                    <XStack alignItems="center" gap={8}>
                      <MaterialCommunityIcons
                        name="water"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Water Target
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={8}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="2.5"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setWaterTarget)}
                        value={waterTarget}
                        maxLength={4}
                      />
                      <Text fontSize={14} color="$textMuted">L/day</Text>
                    </XStack>
                  </YStack>

                  {/* Weight Target */}
                  <YStack gap={8}>
                    <XStack alignItems="center" gap={8}>
                      <MaterialCommunityIcons
                        name="scale-bathroom"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Weight Target (optional)
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={8}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="75.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setWeightTarget)}
                        value={weightTarget}
                        maxLength={5}
                      />
                      <Text fontSize={14} color="$textMuted">kg</Text>
                    </XStack>
                  </YStack>

                  {/* Waist Target */}
                  <YStack gap={8}>
                    <XStack alignItems="center" gap={8}>
                      <MaterialCommunityIcons
                        name="tape-measure"
                        size={20}
                        color={theme.primary?.val ?? '#8B5CF6'}
                      />
                      <Text fontSize={14} fontWeight="600" color="$color">
                        Waist Target (optional)
                      </Text>
                    </XStack>
                    <XStack alignItems="center" gap={8}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="80.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleChange(setWaistTarget)}
                        value={waistTarget}
                        maxLength={5}
                      />
                      <Text fontSize={14} color="$textMuted">cm</Text>
                    </XStack>
                  </YStack>
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
