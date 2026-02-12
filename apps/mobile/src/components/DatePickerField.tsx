import React, { useState } from 'react';
import { Pressable, Platform } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, useTheme } from '@tamagui/core';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, getTodayISO } from '@progress/shared';

interface DatePickerFieldProps {
  value: string;
  onChange: (date: string) => void;
  maximumDate?: Date;
}

/**
 * Cross-platform date picker field.
 * - Native (iOS/Android): tappable row that expands to show DateTimePicker
 * - Web: styled HTML date input with built-in browser date picker
 */
export function DatePickerField({ value, onChange, maximumDate }: DatePickerFieldProps): React.ReactElement {
  const theme = useTheme();

  if (Platform.OS === 'web') {
    return (
      <XStack
        backgroundColor="$backgroundHover"
        padding="$3"
        borderRadius="$3"
        alignItems="center"
        gap="$2"
      >
        <MaterialCommunityIcons
          name="calendar"
          size={20}
          color={theme.textMuted?.val ?? '#A1A1AA'}
        />
        {React.createElement('input', {
          type: 'date',
          value,
          max: maximumDate ? maximumDate.toISOString().split('T')[0] : undefined,
          onChange: (e: { target: { value: string } }) => {
            if (e.target.value) onChange(e.target.value);
          },
          style: {
            flex: 1,
            backgroundColor: 'transparent',
            color: theme.color?.val ?? '#FAFAFA',
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            colorScheme: 'dark',
            outline: 'none',
            padding: 0,
          },
        } as never)}
      </XStack>
    );
  }

  return <NativeDatePicker value={value} onChange={onChange} maximumDate={maximumDate} />;
}

/**
 * Native date picker with trigger row and expandable DateTimePicker.
 * Separated to avoid importing DateTimePicker on web.
 */
function NativeDatePicker({ value, onChange, maximumDate }: DatePickerFieldProps): React.ReactElement {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  // Lazy import to avoid loading the native module on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DateTimePicker = require('@react-native-community/datetimepicker').default;
  type DateTimePickerEvent = import('@react-native-community/datetimepicker').DateTimePickerEvent;

  const handleChange = (event: DateTimePickerEvent, pickedDate?: Date): void => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && pickedDate) {
      const isoDateParts = pickedDate.toISOString().split('T');
      const isoDate = isoDateParts[0] ?? getTodayISO();
      onChange(isoDate);
    }
  };

  return (
    <YStack>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={{ cursor: 'pointer', userSelect: 'none' } as never}
      >
        <XStack
          backgroundColor="$backgroundHover"
          padding="$3"
          borderRadius="$3"
          alignItems="center"
          gap="$2"
        >
          <MaterialCommunityIcons
            name="calendar"
            size={20}
            color={theme.textMuted?.val ?? '#A1A1AA'}
          />
          <Text flex={1} fontSize={15} fontWeight="600" color="$color">
            {formatDate(value)}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textMuted?.val ?? '#A1A1AA'}
          />
        </XStack>
      </Pressable>

      {showPicker && (
        <YStack marginTop="$2">
          {Platform.OS === 'ios' && (
            <XStack justifyContent="flex-end" marginBottom="$2">
              <Pressable
                onPress={() => setShowPicker(false)}
                style={{ cursor: 'pointer', userSelect: 'none' } as never}
              >
                <Text fontSize={16} fontWeight="600" color="$primary">
                  Done
                </Text>
              </Pressable>
            </XStack>
          )}
          <DateTimePicker
            value={new Date(value + 'T12:00:00')}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maximumDate}
            onChange={handleChange}
            themeVariant="dark"
          />
        </YStack>
      )}
    </YStack>
  );
}
