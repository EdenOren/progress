/**
 * Simple logger utility for non-critical errors and warnings.
 * Can be extended later to integrate with a proper logging service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  /** Error object if applicable */
  error?: unknown;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Log a message at the specified level.
 * In production, this could be extended to send to a logging service.
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  // In development, use console methods
  // In production, this could be replaced with a proper logging service
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  switch (level) {
    case 'debug':
      // Only log debug in development
      if (process.env['NODE_ENV'] !== 'production') {
        // eslint-disable-next-line no-console
        console.debug(logMessage, context ?? '');
      }
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(logMessage, context ?? '');
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(logMessage, context ?? '');
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(logMessage, context ?? '');
      break;
  }
}

/** Log a debug message (development only) */
export function logDebug(message: string, context?: LogContext): void {
  log('debug', message, context);
}

/** Log an info message */
export function logInfo(message: string, context?: LogContext): void {
  log('info', message, context);
}

/** Log a warning (non-critical issue) */
export function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context);
}

/** Log an error (critical issue) */
export function logError(message: string, context?: LogContext): void {
  log('error', message, context);
}
