import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useUserSettings, useUpdateSettings } from '../hooks';
import type { ModuleKey } from '@progress/shared';

export type ModuleType = ModuleKey;

interface ModuleContextValue {
  currentModule: ModuleType;
  enabledModules: ModuleType[];
  setModule: (module: ModuleType) => void;
  isLoading: boolean;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

interface ModuleProviderProps {
  children: React.ReactNode;
}

export function ModuleProvider({ children }: ModuleProviderProps): React.ReactElement {
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const updateSettings = useUpdateSettings();

  // Get current module from settings, fallback to workout
  const currentModule: ModuleType = settings?.active_module ?? 'workout';

  // Get enabled modules from settings, fallback to workout only
  const enabledModules: ModuleType[] = settings?.enabled_modules ?? ['workout'];

  const setModule = useCallback((module: ModuleType) => {
    // Optimistically update is handled by React Query's onSuccess
    updateSettings.mutate({ active_module: module });
  }, [updateSettings]);

  const isLoading = settingsLoading || updateSettings.isPending;

  const value = useMemo(
    () => ({
      currentModule,
      enabledModules,
      setModule,
      isLoading,
    }),
    [currentModule, enabledModules, setModule, isLoading]
  );

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule(): ModuleContextValue {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
}
