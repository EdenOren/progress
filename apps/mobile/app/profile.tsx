import React, { useState, useEffect } from 'react';
import { TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { YStack, XStack } from '@tamagui/stacks';
import { Text, Stack, useTheme } from '@tamagui/core';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack as RouterStack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate } from '@progress/shared';
import { Card, DatePickerField, Button } from '../src/components';
import { useProfile, useUpdateProfile } from '../src/hooks';
import { useSupabaseContext } from '../src/providers';
import { showSuccessToast, showErrorToast, getErrorMessage } from '../src/utils';

export default function ProfileScreen(): React.ReactElement {
  const { user } = useSupabaseContext();
  const theme = useTheme();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [heightCm, setHeightCm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDateOfBirth(profile.date_of_birth ?? '');
      setHeightCm(profile.height_cm?.toString() ?? '');
      setHasChanges(false);
    }
  }, [profile]);

  const handleDateChange = (date: string): void => {
    setDateOfBirth(date);
    setHasChanges(true);
  };

  const handleHeightChange = (value: string): void => {
    setHeightCm(value);
    setHasChanges(true);
  };

  const handleSave = async (): Promise<void> => {
    try {
      await updateProfile.mutateAsync({
        date_of_birth: dateOfBirth || null,
        height_cm: heightCm ? parseFloat(heightCm) : null,
      });
      showSuccessToast('Profile updated');
      setHasChanges(false);
    } catch (e) {
      showErrorToast(getErrorMessage(e));
    }
  };

  const needsProfileData = profile && (!profile.date_of_birth || !profile.height_cm);

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
          title: 'Profile',
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
              {/* Avatar + Name */}
              <Card>
                <YStack gap={16}>
                  <Stack
                    width={100}
                    height={100}
                    borderRadius={50}
                    backgroundColor="$primary"
                    justifyContent="center"
                    alignItems="center"
                    alignSelf="center"
                  >
                    <Text fontSize={36} fontWeight="700" color="white">
                      {user?.email?.charAt(0).toUpperCase() ?? 'U'}
                    </Text>
                  </Stack>

                  <YStack alignItems="center" gap={4}>
                    <Text fontSize={18} fontWeight="600" color="$color">
                      {user?.user_metadata?.['display_name'] ?? 'User'}
                    </Text>
                    <Text fontSize={14} color="$textSecondary">
                      {user?.email}
                    </Text>
                  </YStack>
                </YStack>
              </Card>

              {/* KPI prompt banner */}
              {needsProfileData && (
                <XStack
                  backgroundColor="rgba(139, 92, 246, 0.1)"
                  padding={14}
                  borderRadius={12}
                  gap={12}
                  alignItems="center"
                >
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={20}
                    color={theme.primary?.val ?? '#8B5CF6'}
                  />
                  <Text flex={1} fontSize={13} color="$color">
                    Add your height and date of birth for accurate KPI calculations.
                  </Text>
                </XStack>
              )}

              {/* Editable Fields */}
              <Card>
                <YStack gap={20}>
                  <Text fontSize={16} fontWeight="600" color="$color">
                    Personal Info
                  </Text>
                  <Stack height={1} backgroundColor="$borderColor" />

                  {/* Date of Birth */}
                  <YStack gap={8}>
                    <Text fontSize={14} fontWeight="500" color="$textMuted">
                      Date of Birth
                    </Text>
                    {dateOfBirth ? (
                      <DatePickerField
                        value={dateOfBirth}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    ) : (
                      <DatePickerField
                        value={new Date(2000, 0, 1).toISOString().split('T')[0] as string}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    )}
                  </YStack>

                  {/* Height */}
                  <YStack gap={8}>
                    <Text fontSize={14} fontWeight="500" color="$textMuted">
                      Height
                    </Text>
                    <XStack alignItems="center" gap={8}>
                      <TextInput
                        style={inputStyle as never}
                        placeholder="170.0"
                        placeholderTextColor={theme.textMuted?.val ?? '#71717A'}
                        keyboardType="decimal-pad"
                        onChangeText={handleHeightChange}
                        value={heightCm}
                        maxLength={5}
                      />
                      <Text fontSize={14} color="$textMuted">cm</Text>
                    </XStack>
                  </YStack>
                </YStack>
              </Card>

              {/* Account Info */}
              <Card>
                <YStack gap={16}>
                  <Text fontSize={16} fontWeight="600" color="$color">
                    Account
                  </Text>
                  <Stack height={1} backgroundColor="$borderColor" />

                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize={14} color="$color">Email</Text>
                    <Text fontSize={14} color="$textSecondary">{user?.email}</Text>
                  </XStack>

                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontSize={14} color="$color">Member since</Text>
                    <Text fontSize={14} color="$textSecondary">
                      {user?.created_at
                        ? formatDate(user.created_at.split('T')[0] as string)
                        : '-'}
                    </Text>
                  </XStack>
                </YStack>
              </Card>

              {/* Save Button */}
              {hasChanges && (
                <Button
                  variant="primary"
                  fullWidth
                  size="large"
                  loading={updateProfile.isPending}
                  onPress={handleSave}
                >
                  Save Changes
                </Button>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </>
  );
}
