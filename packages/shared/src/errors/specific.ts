import type { ZodError } from 'zod';
import { AppError } from './base';

/**
 * Authentication-related errors (invalid credentials, expired session, etc.)
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

/**
 * Authorization errors (user doesn't have permission)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Data validation errors from Zod schemas
 */
export class ValidationError extends AppError {
  public readonly zodError: ZodError;
  public readonly fieldErrors: Record<string, string[]>;

  constructor(zodError: ZodError) {
    const message = ValidationError.formatZodError(zodError);
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.zodError = zodError;
    this.fieldErrors = zodError.flatten().fieldErrors as Record<string, string[]>;
  }

  private static formatZodError(error: ZodError): string {
    const issues = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    return `Validation failed: ${issues.join(', ')}`;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      fieldErrors: this.fieldErrors,
    };
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  public readonly resource: string;

  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
    this.resource = resource;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      resource: this.resource,
    };
  }
}

/**
 * Duplicate entry errors (unique constraint violations)
 */
export class DuplicateError extends AppError {
  public readonly field?: string;

  constructor(message: string = 'Duplicate entry', field?: string) {
    super(message, 'DUPLICATE', 409);
    this.name = 'DuplicateError';
    this.field = field;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

/**
 * Network/connectivity errors
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * Database operation errors (not covered by more specific errors)
 */
export class DatabaseError extends AppError {
  public readonly pgCode?: string;

  constructor(message: string, pgCode?: string) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
    this.pgCode = pgCode;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      pgCode: this.pgCode,
    };
  }
}

/**
 * Generic server/internal errors
 */
export class InternalError extends AppError {
  constructor(message: string = 'An unexpected error occurred') {
    super(message, 'INTERNAL_ERROR', 500);
    this.name = 'InternalError';
  }
}
