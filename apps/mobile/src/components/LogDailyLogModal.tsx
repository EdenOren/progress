import React, { useState, useEffect } from 'react';
import { Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  getTodayISO,
  formatDate,
  kgToLbs,
  lbsToKg,
  DEFAULT_DAILY_LOG_SETTINGS,
  type DailyLogEntry,
} from '@progress/shared';
import { useUpsertDailyLogEntry, useDeleteDailyLogEntry, useUserSettings } from '../hooks';
import { getErrorMessage, showSuccessToast } from '../utils';
import { Button } from './Button';

// Form schema - at least sleep or weight required
const dailyLogFormSchema = z.object({
  sleepHours: z.string().optional(),
  sleepMinutes: z.string().optional(),
  weightKg: z.string().optional(),
  bodyFatPercent: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    const hasSleep = data.sleepHours && parseFloat(data.sleepHours) > 0;
    const hasWeight = data.weightKg && parseFloat(data.weightKg) > 0;
    return hasSleep || hasWeight;
  },
  { message: 'At least sleep hours or weight must be provided' }
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
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      bodyFatPercent: '',
      notes: '',
    },
  });

  // Reset form when modal opens with existing entry data
  useEffect(() => {
    if (visible) {
      // Reset date to prop value or today
      setSelectedDate(date ?? getTodayISO());
      setShowDatePicker(false);

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
          bodyFatPercent: existingEntry.body_fat_percent?.toString() ?? '',
          notes: existingEntry.notes ?? '',
        });
      } else {
        reset({
          sleepHours: '',
          sleepMinutes: '',
          weightKg: '',
          bodyFatPercent: '',
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
        body_fat_percent: data.bodyFatPercent ? parseFloat(data.bodyFatPercent) : null,
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
    setShowDatePicker(false);
    onClose();
  };

  const handleDateChange = (event: DateTimePickerEvent, pickedDate?: Date): void => {
    // On Android, the picker auto-dismisses; on iOS, we keep it open until "Done"
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && pickedDate) {
      // Convert to ISO date string (YYYY-MM-DD)
      const isoDateParts = pickedDate.toISOString().split('T');
      const isoDate = isoDateParts[0] ?? getTodayISO();
      setSelectedDate(isoDate);
    }
  };

  const handleDatePickerDone = (): void => {
    setShowDatePicker(false);
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            {/* Date Display - Tappable */}
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{ cursor: 'pointer', userSelect: 'none' } as never}
            >
              <XStack
                backgroundColor="$backgroundHover"
                padding="$3"
                borderRadius="$3"
                alignItems="center"
                gap="$2"
                marginBottom="$4"
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color={theme.textMuted?.val ?? '#A1A1AA'}
                />
                <Text flex={1} fontSize={15} fontWeight="600" color="$color">
                  {formatDate(selectedDate)}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.textMuted?.val ?? '#A1A1AA'}
                />
              </XStack>
            </Pressable>

            {/* Date Picker */}
            {showDatePicker && (
              <YStack marginBottom="$4">
                {Platform.OS === 'ios' && (
                  <XStack justifyContent="flex-end" marginBottom="$2">
                    <Pressable
                      onPress={handleDatePickerDone}
                      style={{ cursor: 'pointer', userSelect: 'none' } as never}
                    >
                      <Text fontSize={16} fontWeight="600" color="$primary">
                        Done
                      </Text>
                    </Pressable>
                  </XStack>
                )}
                <DateTimePicker
                  value={new Date(selectedDate + 'T12:00:00')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                  themeVariant="dark"
                />
              </YStack>
            )}

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
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MaterialCommunityIcons
                    name="sleep"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Sleep Duration
                  </Text>
                </XStack>
                <XStack gap="$3" alignItems="center">
                  <Controller
                    control={control}
                    name="sleepHours"
                    render={({ field: { onChange, value } }) => (
                      <XStack flex={1} alignItems="center" gap="$2">
                        <TextInput
                          style={inputStyle as never}
                          placeholder="0"
                          placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                          keyboardType="numeric"
                          onChangeText={onChange}
                          value={value}
                          maxLength={2}
                        />
                        <Text fontSize={14} color="$textMuted">hrs</Text>
                      </XStack>
                    )}
                  />
                  <Controller
                    control={control}
                    name="sleepMinutes"
                    render={({ field: { onChange, value } }) => (
                      <XStack flex={1} alignItems="center" gap="$2">
                        <TextInput
                          style={inputStyle as never}
                          placeholder="0"
                          placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                          keyboardType="numeric"
                          onChangeText={onChange}
                          value={value}
                          maxLength={2}
                        />
                        <Text fontSize={14} color="$textMuted">min</Text>
                      </XStack>
                    )}
                  />
                </XStack>
              </YStack>

              {/* Weight */}
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MaterialCommunityIcons
                    name="scale-bathroom"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Weight (optional)
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="weightKg"
                  render={({ field: { onChange, value } }) => (
                    <XStack alignItems="center" gap="$2">
                      <TextInput
                        style={{ ...inputStyle, flex: 1 } as never}
                        placeholder="0.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={onChange}
                        value={value}
                        maxLength={6}
                      />
                      <Text fontSize={14} color="$textMuted">{weightUnit}</Text>
                    </XStack>
                  )}
                />
              </YStack>

              {/* Body Fat % */}
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MaterialCommunityIcons
                    name="percent"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Body Fat % (optional)
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="bodyFatPercent"
                  render={({ field: { onChange, value } }) => (
                    <XStack alignItems="center" gap="$2">
                      <TextInput
                        style={{ ...inputStyle, flex: 1 } as never}
                        placeholder="0.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={onChange}
                        value={value}
                        maxLength={4}
                      />
                      <Text fontSize={14} color="$textMuted">%</Text>
                    </XStack>
                  )}
                />
              </YStack>

              {/* Notes */}
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text fontSize={14} fontWeight="600" color="$color">
                    Notes (optional)
                  </Text>
                </XStack>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={{
                        ...inputStyle,
                        minHeight: 80,
                        textAlignVertical: 'top',
                        paddingTop: 12,
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
                    variant="ghost"
                    fullWidth
                    size="large"
                    loading={deleteEntry.isPending}
                    onPress={handleDelete}
                  >
                    <Text color="$error" fontWeight="600">
                      Delete Entry
                    </Text>
                  </Button>
                )}
              </YStack>
            </YStack>
          </ScrollView>
        </YStack>
      </KeyboardAvoidingView>
    </Modal>
  );
}
