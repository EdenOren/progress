import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ModuleType = 'workout' | 'sleep';

interface ModuleContextValue {
  currentModule: ModuleType;
  setModule: (module: ModuleType) => void;
  isLoading: boolean;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

const STORAGE_KEY = 'progress-current-module';

// Web storage interface
interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Storage helpers that work on both mobile and web
async function getStoredModule(): Promise<string | null> {
  if (Platform.OS === 'web') {
    // Access localStorage through globalThis for TypeScript compatibility
    const win = globalThis as unknown as { localStorage?: WebStorage };
    if (win.localStorage) {
      return win.localStorage.getItem(STORAGE_KEY);
    }
    return null;
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

async function setStoredModule(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    const win = globalThis as unknown as { localStorage?: WebStorage };
    if (win.localStorage) {
      win.localStorage.setItem(STORAGE_KEY, value);
    }
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

interface ModuleProviderProps {
  children: React.ReactNode;
}

export function ModuleProvider({ children }: ModuleProviderProps): React.ReactElement {
  const [currentModule, setCurrentModule] = useState<ModuleType>('workout');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved module on mount
  useEffect(() => {
    getStoredModule()
      .then((saved: string | null) => {
        if (saved === 'workout' || saved === 'sleep') {
          setCurrentModule(saved);
        }
      })
      .catch(() => {
        // Ignore errors, use default
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const setModule = useCallback((module: ModuleType) => {
    setCurrentModule(module);
    setStoredModule(module).catch(() => {
      // Ignore storage errors
    });
  }, []);

  return (
    <ModuleContext.Provider value={{ currentModule, setModule, isLoading }}>
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
