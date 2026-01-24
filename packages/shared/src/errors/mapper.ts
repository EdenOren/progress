import type { PostgrestError, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { AppError } from './base';
import {
  AuthError,
  NotFoundError,
  DuplicateError,
  ForbiddenError,
  DatabaseError,
  NetworkError,
} from './specific';

/**
 * Map Supabase Postgrest errors to AppError types.
 * See: https://postgrest.org/en/stable/errors.html
 */
export function mapSupabaseError(error: PostgrestError): AppError {
  const { code, message, details } = error;

  // PostgreSQL error codes
  // See: https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch (code) {
    // Unique violation
    case '23505':
      return new DuplicateError(
        details?.includes('Key')
          ? `Duplicate value: ${details}`
          : 'A record with this value already exists'
      );

    // Foreign key violation
    case '23503':
      return new AppError(
        'Referenced record does not exist',
        'FK_VIOLATION',
        400
      );

    // Not null violation
    case '23502':
      return new AppError(
        `Required field missing: ${details ?? message}`,
        'NOT_NULL_VIOLATION',
        400
      );

    // Check constraint violation
    case '23514':
      return new AppError(
        `Validation constraint failed: ${message}`,
        'CHECK_VIOLATION',
        400
      );

    // Insufficient privilege
    case '42501':
      return new ForbiddenError('You do not have permission to perform this action');

    // Undefined table
    case '42P01':
      return new DatabaseError(`Table not found: ${message}`, code);

    // Undefined column
    case '42703':
      return new DatabaseError(`Column not found: ${message}`, code);

    default:
      break;
  }

  // PostgREST specific error codes
  // See: https://postgrest.org/en/stable/errors.html
  if (code?.startsWith('PGRST')) {
    switch (code) {
      // No rows returned (used with .single())
      case 'PGRST116':
        return new NotFoundError('Record');

      // Multiple rows returned when expecting single
      case 'PGRST102':
        return new AppError(
          'Multiple records found when expecting one',
          'MULTIPLE_ROWS',
          400
        );

      // Request body required
      case 'PGRST105':
        return new AppError('Request body is required', 'BODY_REQUIRED', 400);

      default:
        return new DatabaseError(message, code);
    }
  }

  // Fallback for unknown errors
  return new DatabaseError(message || 'An unknown database error occurred', code);
}

/**
 * Map Supabase Auth errors to AppError types
 */
export function mapSupabaseAuthError(error: SupabaseAuthError): AppError {
  const message = error.message.toLowerCase();

  // Invalid credentials
  if (message.includes('invalid login credentials') || message.includes('invalid password')) {
    return new AuthError('Invalid email or password');
  }

  // User already exists
  if (message.includes('user already registered') || message.includes('already exists')) {
    return new DuplicateError('An account with this email already exists', 'email');
  }

  // Email not confirmed
  if (message.includes('email not confirmed')) {
    return new AuthError('Please verify your email address before logging in');
  }

  // Invalid email format
  if (message.includes('invalid email')) {
    return new AppError('Please enter a valid email address', 'INVALID_EMAIL', 400);
  }

  // Weak password
  if (message.includes('password')) {
    return new AppError(error.message, 'WEAK_PASSWORD', 400);
  }

  // Session expired / not authenticated
  if (message.includes('session') || message.includes('jwt') || message.includes('token')) {
    return new AuthError('Your session has expired. Please log in again.');
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return new AppError('Too many attempts. Please try again later.', 'RATE_LIMITED', 429);
  }

  // Network issues
  if (message.includes('network') || message.includes('fetch')) {
    return new NetworkError('Unable to connect. Please check your internet connection.');
  }

  // Fallback
  return new AuthError(error.message);
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout')
    );
  }
  return false;
}
