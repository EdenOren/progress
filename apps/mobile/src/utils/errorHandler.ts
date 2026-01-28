import {
  AppError,
  AuthError,
  NetworkError,
  ValidationError,
  NotFoundError,
  DuplicateError,
} from '@progress/shared';
import { showErrorToast } from './toast';

export interface ErrorHandlerOptions {
  /** Show toast notification (default: true) */
  showToast?: boolean;
  /** Custom title for the toast */
  title?: string;
}

const defaultOptions: ErrorHandlerOptions = {
  showToast: true,
};

/**
 * Check if error is a Supabase PGRST error
 */
function isPgrstError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('PGRST')
  );
}

/**
 * Get a user-friendly message for an error
 */
export function getErrorMessage(error: unknown): string {
  // Handle Supabase PGRST errors
  if (isPgrstError(error)) {
    if (error.code === 'PGRST116') {
      // "Cannot coerce the result to a single JSON object" - 0 rows returned
      return 'This item may have been deleted. Please refresh.';
    }
    // Other PGRST errors
    return 'Database error. Please try again.';
  }

  if (error instanceof NetworkError) {
    return 'Unable to connect. Please check your internet connection.';
  }

  if (error instanceof AuthError) {
    return error.message || 'Session expired. Please sign in again.';
  }

  if (error instanceof ValidationError) {
    // Get first field error or generic message
    const fieldErrors = Object.entries(error.fieldErrors);
    if (fieldErrors.length > 0) {
      const [field, messages] = fieldErrors[0] as [string, string[]];
      return messages[0] || `Invalid ${field}`;
    }
    return 'Please check your input and try again.';
  }

  if (error instanceof NotFoundError) {
    return `${error.resource} not found. It may have been deleted.`;
  }

  if (error instanceof DuplicateError) {
    return error.field
      ? `A ${error.field} with this value already exists.`
      : 'This record already exists.';
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const msg = error.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch failed')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    if (msg.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Central error handler for the app
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const message = getErrorMessage(error);

  // Log error for debugging (in development)
  if (__DEV__) {
    console.error('[Error]', error);
  }

  // Show toast notification
  if (opts.showToast) {
    showErrorToast(message, opts.title);
  }
}

/**
 * Handle an error and return a message (for inline display)
 */
export function handleErrorSilent(error: unknown): string {
  handleError(error, { showToast: false });
  return getErrorMessage(error);
}

/**
 * Check if error is a network error
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
      message.includes('connection')
    );
  }
  return false;
}

/**
 * Check if error requires re-authentication
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof AuthError;
}
