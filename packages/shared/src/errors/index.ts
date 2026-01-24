// Base error class
export { AppError } from './base';

// Specific error types
export {
  AuthError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  DuplicateError,
  NetworkError,
  DatabaseError,
  InternalError,
} from './specific';

// Error mappers
export {
  mapSupabaseError,
  mapSupabaseAuthError,
  isNetworkError,
} from './mapper';
