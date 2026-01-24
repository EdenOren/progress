import type { AppError } from '../errors/base';

/**
 * A discriminated union type for handling success/failure cases.
 * Use this for all API functions to ensure consistent error handling.
 *
 * @example
 * ```typescript
 * async function getUser(id: string): Promise<Result<User>> {
 *   const { data, error } = await supabase.from('users').select().eq('id', id).single();
 *   if (error) return err(mapSupabaseError(error));
 *   return ok(data);
 * }
 *
 * const result = await getUser('123');
 * if (result.success) {
 *   console.log(result.data); // User
 * } else {
 *   console.error(result.error); // AppError
 * }
 * ```
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful Result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed Result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if a Result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard to check if a Result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Unwrap a Result, throwing if it's an error
 * Only use when you're certain the result is successful
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwrap a Result with a default value for errors
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Map over a successful Result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Map over an error Result
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (!result.success) {
    return err(fn(result.error));
  }
  return result;
}
