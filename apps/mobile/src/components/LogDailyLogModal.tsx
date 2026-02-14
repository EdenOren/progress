import React, { useState, useEffect } from 'react';
import { Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatePickerField } from './DatePickerField';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTodayISO,
  kgToLbs,
  lbsToKg,
  DEFAULT_DAILY_LOG_SETTINGS,
  type DailyLogEntry,
} from '@progress/shared';
import { useUpsertDailyLogEntry, useDeleteDailyLogEntry, useUserSettings } from '../hooks';
import { getErrorMessage, showSuccessToast } from '../utils';
import { Button } from './Button';

// Form schema - at least one metric required
const dailyLogFormSchema = z.object({
  sleepHours: z.string().optional(),
  sleepMinutes: z.string().optional(),
  weightKg: z.string().optional(),
  waterIntakeLiters: z.string().optional(),
  waistCm: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    const hasSleep = data.sleepHours && parseFloat(data.sleepHours) > 0;
    const hasWeight = data.weightKg && parseFloat(data.weightKg) > 0;
    const hasWater = data.waterIntakeLiters && parseFloat(data.waterIntakeLiters) > 0;
    const hasWaist = data.waistCm && parseFloat(data.waistCm) > 0;
    return hasSleep || hasWeight || hasWater || hasWaist;
  },
  { message: 'At least one metric must be provided' }
);

type DailyLogForm = z.infer<typeof dailyLogFormSchema>;

interface LogDailyLogModalProps {
  visible: boolean;
  onClose: () => void;
  date?: string; // ISO date string, defaults to today
  existingEntry?: DailyLogEntry | null;
}

export function LogDailyLogModal({
  visible,
  onClose,
  date,
  existingEntry,
}: LogDailyLogModalProps): React.ReactElement {
  const theme = useTheme();
  const upsertEntry = useUpsertDailyLogEntry();
  const deleteEntry = useDeleteDailyLogEntry();
  const { data: settings } = useUserSettings();
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(date ?? getTodayISO());

  const isEditing = !!existingEntry;

  // Get weight unit from settings
  const weightUnit = settings?.module_settings.daily_log?.weight_unit ?? DEFAULT_DAILY_LOG_SETTINGS.weight_unit;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DailyLogForm>({
    resolver: zodResolver(dailyLogFormSchema),
    defaultValues: {
      sleepHours: '',
      sleepMinutes: '',
      weightKg: '',
      waterIntakeLiters: '',
      waistCm: '',
      notes: '',
    },
  });

  // Reset form when modal opens with existing entry data
  useEffect(() => {
    if (visible) {
      // Reset date to prop value or today
      setSelectedDate(date ?? getTodayISO());

      if (existingEntry) {
        const hours = existingEntry.sleep_hours ? Math.floor(existingEntry.sleep_hours) : undefined;
        const minutes = existingEntry.sleep_hours ? Math.round((existingEntry.sleep_hours % 1) * 60) : undefined;
        // Convert stored kg to user's preferred unit for display
        let displayWeight = '';
        if (existingEntry.weight_kg !== null) {
          const weight = weightUnit === 'lbs' ? kgToLbs(existingEntry.weight_kg) : existingEntry.weight_kg;
          displayWeight = weight.toFixed(1);
        }
        reset({
          sleepHours: hours?.toString() ?? '',
          sleepMinutes: minutes?.toString() ?? '',
          weightKg: displayWeight,
          waterIntakeLiters: existingEntry.water_intake_liters?.toString() ?? '',
          waistCm: existingEntry.waist_cm?.toString() ?? '',
          notes: existingEntry.notes ?? '',
        });
      } else {
        reset({
          sleepHours: '',
          sleepMinutes: '',
          weightKg: '',
          waterIntakeLiters: '',
          waistCm: '',
          notes: '',
        });
      }
      setError(null);
    }
  }, [visible, existingEntry, reset, weightUnit, date]);

  const onSubmit = async (data: DailyLogForm): Promise<void> => {
    setError(null);

    // Calculate total sleep hours
    const hours = data.sleepHours ? parseFloat(data.sleepHours) : 0;
    const minutes = data.sleepMinutes ? parseFloat(data.sleepMinutes) : 0;
    const totalSleepHours = hours + (minutes / 60);

    // Convert weight to kg if user entered in lbs
    let weightKg: number | null = null;
    if (data.weightKg) {
      const inputWeight = parseFloat(data.weightKg);
      weightKg = weightUnit === 'lbs' ? lbsToKg(inputWeight) : inputWeight;
    }

    try {
      await upsertEntry.mutateAsync({
        logged_date: selectedDate,
        sleep_hours: totalSleepHours > 0 ? parseFloat(totalSleepHours.toFixed(2)) : null,
        weight_kg: weightKg !== null ? parseFloat(weightKg.toFixed(2)) : null,
        water_intake_liters: data.waterIntakeLiters ? parseFloat(parseFloat(data.waterIntakeLiters).toFixed(2)) : null,
        waist_cm: data.waistCm ? parseFloat(parseFloat(data.waistCm).toFixed(1)) : null,
        notes: data.notes || null,
      });

      showSuccessToast(isEditing ? 'Entry updated' : 'Entry saved');
      handleClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!existingEntry) return;

    try {
      await deleteEntry.mutateAsync({
        entryId: existingEntry.id,
        loggedDate: existingEntry.logged_date,
      });
      showSuccessToast('Entry deleted');
      handleClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleClose = (): void => {
    reset();
    setError(null);
    onClose();
  };

  const inputStyle = {
    width: 80,
    backgroundColor: theme.backgroundHover?.val ?? '#27272A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.color?.val ?? '#FAFAFA',
    textAlign: 'right' as const,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Pressable
              onPress={handleClose}
              style={{ cursor: 'pointer', userSelect: 'none' } as never}
            >
              <Text fontSize={16} color="$primary">
                Cancel
              </Text>
            </Pressable>
            <Text fontWeight="700" fontSize={17}>
              {isEditing ? 'Edit Entry' : 'Log Entry'}
            </Text>
            <Stack width={60} />
          </XStack>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Date Picker */}
            <Stack marginBottom="$4">
              <DatePickerField
                value={selectedDate}
                onChange={setSelectedDate}
                maximumDate={new Date()}
              />
            </Stack>

            {error && (
              <YStack
                marginBottom="$4"
                backgroundColor="rgba(239, 68, 68, 0.15)"
                padding={16}
                borderRadius={8}
              >
                <Text color="$error" fontSize={14}>
                  {error}
                </Text>
              </YStack>
            )}

            {/* Form validation error */}
            {errors.root && (
              <YStack
                marginBottom="$4"
                backgroundColor="rgba(239, 68, 68, 0.15)"
                padding={16}
                borderRadius={8}
              >
                <Text color="$error" fontSize={14}>
                  {errors.root.message}
                </Text>
              </YStack>
            )}

            <YStack gap="$5">
              {/* Sleep Duration */}
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2" flex={1}>
                  <MaterialCommunityIcons
                    name="sleep"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Sleep
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$2">
                  <Controller
                    control={control}
                    name="sleepHours"
                    render={({ field: { onChange, value } }) => (
                      <XStack alignItems="center" gap={4}>
                        <TextInput
                          style={inputStyle as never}
                          placeholder="0"
                          placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                          keyboardType="numeric"
                          onChangeText={onChange}
                          value={value}
                          maxLength={2}
                        />
                        <Text fontSize={13} color="$textMuted">h</Text>
                      </XStack>
                    )}
                  />
                  <Controller
                    control={control}
                    name="sleepMinutes"
                    render={({ field: { onChange, value } }) => (
                      <XStack alignItems="center" gap={4}>
                        <TextInput
                          style={inputStyle as never}
                          placeholder="0"
                          placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                          keyboardType="numeric"
                          onChangeText={onChange}
                          value={value}
                          maxLength={2}
                        />
                        <Text fontSize={13} color="$textMuted">m</Text>
                      </XStack>
                    )}
                  />
                </XStack>
              </XStack>

              {/* Weight */}
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2" flex={1}>
                  <MaterialCommunityIcons
                    name="scale-bathroom"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Weight
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="weightKg"
                  render={({ field: { onChange, value } }) => (
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="0.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={onChange}
                        value={value}
                        maxLength={6}
                      />
                      <Text fontSize={13} color="$textMuted" minWidth={24}>{weightUnit}</Text>
                    </XStack>
                  )}
                />
              </XStack>

              {/* Water Intake */}
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2" flex={1}>
                  <MaterialCommunityIcons
                    name="water"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Water
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="waterIntakeLiters"
                  render={({ field: { onChange, value } }) => (
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="0.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={onChange}
                        value={value}
                        maxLength={5}
                      />
                      <Text fontSize={13} color="$textMuted" width={24}>L</Text>
                    </XStack>
                  )}
                />
              </XStack>

              {/* Waist Circumference */}
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2" flex={1}>
                  <MaterialCommunityIcons
                    name="tape-measure"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Waist
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="waistCm"
                  render={({ field: { onChange, value } }) => (
                    <XStack alignItems="center" gap={6}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="0.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={onChange}
                        value={value}
                        maxLength={5}
                      />
                      <Text fontSize={13} color="$textMuted" width={24}>cm</Text>
                    </XStack>
                  )}
                />
              </XStack>

              {/* Notes */}
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Notes
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        width: '100%',
                        backgroundColor: theme.backgroundHover?.val ?? '#27272A',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: theme.color?.val ?? '#FAFAFA',
                        minHeight: 80,
                        textAlignVertical: 'top',
                      } as never}
                      placeholder="How did you feel? Any notes..."
                      placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                      multiline
                      numberOfLines={3}
                      onChangeText={onChange}
                      value={value}
                      maxLength={500}
                    />
                  )}
                />
              </YStack>

              {/* Action Buttons */}
              <YStack gap="$3" marginTop="$2">
                <Button
                  variant="primary"
                  fullWidth
                  size="large"
                  loading={upsertEntry.isPending}
                  onPress={handleSubmit(onSubmit)}
                >
                  {isEditing ? 'Update Entry' : 'Save Entry'}
                </Button>

                {isEditing && (
                  <Button
                    variant="danger"
                    fullWidth
                    size="large"
                    loading={deleteEntry.isPending}
                    onPress={handleDelete}
                  >
                    Delete Entry
                  </Button>
                )}
              </YStack>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
