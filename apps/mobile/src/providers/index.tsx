import React from 'react';
import { TamaguiProvider, Theme } from '@tamagui/core';
import { useColorScheme } from 'react-native';
import { SupabaseProvider } from './supabase';
import { QueryProvider } from './query';
import config from '../../tamagui.config';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.ReactElement {
  const colorScheme = useColorScheme();

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
        <QueryProvider>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </QueryProvider>
      </Theme>
    </TamaguiProvider>
  );
}

export { useSupabaseContext } from './supabase';
export { queryClient } from './query';
