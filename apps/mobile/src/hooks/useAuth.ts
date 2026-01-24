import { useCallback, useMemo } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  getSupabase,
  mapSupabaseAuthError,
  type Result,
  ok,
  err,
  AppError,
} from '@progress/shared';
import { useSupabaseContext } from '../providers';

// Ensure web browser redirects are handled
WebBrowser.maybeCompleteAuthSession();

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpResult {
  confirmed: boolean;
}

export interface UseAuthReturn {
  user: ReturnType<typeof useSupabaseContext>['user'];
  session: ReturnType<typeof useSupabaseContext>['session'];
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (params: SignUpParams) => Promise<Result<SignUpResult>>;
  signIn: (params: SignInParams) => Promise<Result<void>>;
  signInWithGoogle: () => Promise<Result<void>>;
  signOut: () => Promise<Result<void>>;
  resetPassword: (email: string) => Promise<Result<void>>;
  resendVerification: (email: string) => Promise<Result<void>>;
}

export function useAuth(): UseAuthReturn {
  const { user, session, isLoading } = useSupabaseContext();

  const isAuthenticated = useMemo(() => !!session, [session]);

  const signUp = useCallback(async (params: SignUpParams): Promise<Result<SignUpResult>> => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
        options: {
          data: {
            display_name: params.displayName,
          },
        },
      });

      if (error) {
        return err(mapSupabaseAuthError(error));
      }

      const confirmed = !!data.session;
      return ok({ confirmed });
    } catch (e) {
      return err(new AppError('Sign up failed', 'SIGNUP_ERROR'));
    }
  }, []);

  const signIn = useCallback(async (params: SignInParams): Promise<Result<void>> => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: params.email,
        password: params.password,
      });

      if (error) {
        return err(mapSupabaseAuthError(error));
      }

      return ok(undefined);
    } catch (e) {
      return err(new AppError('Sign in failed', 'SIGNIN_ERROR'));
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<Result<void>> => {
    try {
      const supabase = getSupabase();

      const redirectTo = makeRedirectUri({
        scheme: 'progress',
        path: 'auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        return err(mapSupabaseAuthError(error));
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

        if (result.type === 'success') {
          const url = result.url;
          // Extract tokens from URL and set session
          const params = new URL(url).searchParams;
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }

      return ok(undefined);
    } catch (e) {
      return err(new AppError('Google sign in failed', 'GOOGLE_SIGNIN_ERROR'));
    }
  }, []);

  const signOut = useCallback(async (): Promise<Result<void>> => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return err(mapSupabaseAuthError(error));
      }

      return ok(undefined);
    } catch (e) {
      return err(new AppError('Sign out failed', 'SIGNOUT_ERROR'));
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<Result<void>> => {
    try {
      const supabase = getSupabase();

      const redirectTo = makeRedirectUri({
        scheme: 'progress',
        path: 'auth/reset-password',
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        return err(mapSupabaseAuthError(error));
      }

      return ok(undefined);
    } catch (e) {
      return err(new AppError('Password reset failed', 'RESET_PASSWORD_ERROR'));
    }
  }, []);

  const resendVerification = useCallback(async (email: string): Promise<Result<void>> => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return err(mapSupabaseAuthError(error));
      }

      return ok(undefined);
    } catch (e) {
      return err(new AppError('Failed to resend verification email', 'RESEND_ERROR'));
    }
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    resendVerification,
  };
}
