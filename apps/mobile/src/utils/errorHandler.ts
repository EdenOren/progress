import { Alert } from 'react-native';
import {
  AppError,
  AuthError,
  NetworkError,
  ValidationError,
  NotFoundError,
  DuplicateError,
} from '@progress/shared';

export interface ErrorHandlerOptions {
  showAlert?: boolean;
}

const defaultOptions: ErrorHandlerOptions = {
  showAlert: true,
};

/**
 * Get a user-friendly message for an error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'Unable to connect. Please check your internet connection.';
  }

  if (error instanceof AuthError) {
    return error.message || 'Authentication failed. Please log in again.';
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
    return `${error.resource} not found.`;
  }

  if (error instanceof DuplicateError) {
    return error.field
      ? `A record with this ${error.field} already exists.`
      : 'This record already exists.';
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
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


  // Show alert to user
  if (opts.showAlert) {
    Alert.alert('Error', message);
  }
}

/**
 * Handle an error and return a message (for inline display)
 */
export function handleErrorSilent(error: unknown): string {
  handleError(error, { showAlert: false });
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
