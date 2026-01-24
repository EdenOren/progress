import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { initSupabase, getSupabase, validateEnv, type Env } from '@progress/shared';
import type { Session, User } from '@supabase/supabase-js';

interface SupabaseContextValue {
  isInitialized: boolean;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  isInitialized: false,
  session: null,
  user: null,
  isLoading: true,
});

export function useSupabaseContext(): SupabaseContextValue {
  return useContext(SupabaseContext);
}

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps): React.ReactElement {
  const [isInitialized, setIsInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Supabase client
    const env: Env = validateEnv({
      SUPABASE_URL: process.env['EXPO_PUBLIC_SUPABASE_URL'],
      SUPABASE_ANON_KEY: process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    });

    initSupabase(env);
    setIsInitialized(true);

    const supabase = getSupabase();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    // Handle app state changes for token refresh
    const handleAppStateChange = (state: AppStateStatus): void => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSubscription.remove();
    };
  }, []);

  const value: SupabaseContextValue = {
    isInitialized,
    session,
    user: session?.user ?? null,
    isLoading,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
