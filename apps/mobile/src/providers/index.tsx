import React from 'react';
import { TamaguiProvider, Theme } from '@tamagui/core';
import { SupabaseProvider } from './supabase';
import { QueryProvider } from './query';
import { ModuleProvider } from './module';
import { useAppColorScheme } from '../hooks/useAppColorScheme';
import config from '../../tamagui.config';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.ReactElement {
  const colorScheme = useAppColorScheme();

  return (
    <TamaguiProvider config={config}>
      <Theme name={colorScheme}>
        <QueryProvider>
          <SupabaseProvider>
            <ModuleProvider>
              {children}
            </ModuleProvider>
          </SupabaseProvider>
        </QueryProvider>
      </Theme>
    </TamaguiProvider>
  );
}

export { useSupabaseContext } from './supabase';
export { queryClient } from './query';
export { useModule, type ModuleType } from './module';
