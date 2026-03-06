import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { initSupabase, getSupabase, validateEnv, type Env } from '@progress/shared';
import type { Session, User } from '@supabase/supabase-js';

interface SupabaseContextValue {
  isInitialized: boolean;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  isInitialized: false,
  session: null,
  user: null,
  isLoading: true,
  error: null,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let appStateSubscription: { remove: () => void } | null = null;

    const initialize = async (): Promise<void> => {
      try {
        // Check if env vars exist first
        const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'];
        const supabaseKey = process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'];

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            `Missing environment variables:\n` +
            `EXPO_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'set' : 'MISSING'}\n` +
            `EXPO_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? 'set' : 'MISSING'}`
          );
        }

        // Initialize Supabase client
        const env: Env = validateEnv({
          SUPABASE_URL: supabaseUrl,
          SUPABASE_ANON_KEY: supabaseKey,
        });

        initSupabase(env, {
          detectSessionInUrl: Platform.OS === 'web',
        });
        setIsInitialized(true);

        const supabase = getSupabase();

        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout - could not reach Supabase')), 10000);
        });

        const { data: { session: initialSession } } = await Promise.race([sessionPromise, timeoutPromise]);
        setSession(initialSession);
        setIsLoading(false);

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            setSession(newSession);
          }
        );
        subscription = data.subscription;

        // Handle app state changes for token refresh
        const handleAppStateChange = (state: AppStateStatus): void => {
          if (state === 'active') {
            supabase.auth.startAutoRefresh();
          } else {
            supabase.auth.stopAutoRefresh();
          }
        };

        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize';
        setError(message);
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      subscription?.unsubscribe();
      appStateSubscription?.remove();
    };
  }, []);

  const value: SupabaseContextValue = {
    isInitialized,
    session,
    user: session?.user ?? null,
    isLoading,
    error,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}
