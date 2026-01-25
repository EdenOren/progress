import React from 'react';
import { Redirect } from 'expo-router';
import { YStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { useSupabaseContext } from '../src/providers';
import { LoadingScreen } from '../src/components';

export default function Index(): React.ReactElement {
  const { isLoading, session, user, error } = useSupabaseContext();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error if Supabase initialization failed (e.g., missing env vars)
  if (error) {
    return (
      <YStack
        flex={1}
        minHeight="100vh"
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
        padding="$4"
      >
        <Text fontSize={18} fontWeight="600" color="$error" marginBottom="$2">
          Configuration Error
        </Text>
        <Text fontSize={14} color="$textMuted" textAlign="center">
          {error}
        </Text>
      </YStack>
    );
  }

  if (session && user) {
    // If email not verified, send to verification screen
    if (!user.email_confirmed_at) {
      return (
        <Redirect
          href={`/(auth)/signup-success?email=${encodeURIComponent(user.email ?? '')}` as any}
        />
      );
    }
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
