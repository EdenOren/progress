import { z } from 'zod';

/**
 * Environment variable schema.
 * Validates required configuration at app startup.
 */
const envSchema = z.object({
  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL must be a valid URL')
    .refine(
      (url) => url.includes('supabase.co') || url.includes('localhost'),
      'SUPABASE_URL must be a Supabase URL or localhost'
    ),
  SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'SUPABASE_ANON_KEY is required')
    .regex(
      /^eyJ/,
      'SUPABASE_ANON_KEY must be a valid JWT token'
    ),
});

/**
 * Validated environment type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validation result for more granular error handling
 */
export interface EnvValidationResult {
  success: boolean;
  env?: Env;
  errors?: string[];
}

/**
 * Validate environment variables.
 * Call this at app startup to fail fast on misconfiguration.
 *
 * @example
 * ```typescript
 * // In app entry point
 * import { validateEnv } from '@progress/shared';
 *
 * const env = validateEnv({
 *   SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
 *   SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
 * });
 * ```
 *
 * @throws Error if validation fails
 */
export function validateEnv(env: Record<string, unknown>): Env {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.');
      return `  - ${path}: ${issue.message}`;
    });

    throw new Error(
      `Environment validation failed:\n${errors.join('\n')}\n\n` +
        'Please check your .env file and ensure all required variables are set.'
    );
  }

  return result.data;
}

/**
 * Validate environment variables without throwing.
 * Useful for checking configuration before app fully initializes.
 */
export function validateEnvSafe(env: Record<string, unknown>): EnvValidationResult {
  const result = envSchema.safeParse(env);

  if (result.success) {
    return { success: true, env: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return { success: false, errors };
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env['NODE_ENV'] === 'development' || __DEV__ === true;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

// Declare __DEV__ for React Native
declare const __DEV__: boolean | undefined;
