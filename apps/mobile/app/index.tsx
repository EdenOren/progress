import React from 'react';
import { Redirect } from 'expo-router';
import { useSupabaseContext } from '../src/providers';
import { LoadingScreen } from '../src/components';

export default function Index(): React.ReactElement {
  const { isLoading, session } = useSupabaseContext();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
