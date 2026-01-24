import React from 'react';
import { Redirect } from 'expo-router';
import { useSupabaseContext } from '../src/providers';
import { LoadingScreen } from '../src/components';

export default function Index(): React.ReactElement {
  const { isLoading, session, user } = useSupabaseContext();

  if (isLoading) {
    return <LoadingScreen />;
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
