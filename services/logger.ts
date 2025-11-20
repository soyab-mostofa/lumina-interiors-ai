/**
 * Logging utility for consistent logging across the application
 * Automatically handles development vs production environments
 */

import { LOGGING } from './constants';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!LOGGING.ENABLE_DEV_LOGS && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        // In production, send to error tracking service (e.g., Sentry)
        if (LOGGING.ENABLE_ERROR_TRACKING && process.env.NODE_ENV === 'production') {
          // TODO: Implement error tracking service integration
        }
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'info':
        if (LOGGING.ENABLE_DEV_LOGS) {
          console.info(prefix, message, data || '');
        }
        break;
      case 'debug':
        if (LOGGING.ENABLE_DEV_LOGS) {
          console.debug(prefix, message, data || '');
        }
        break;
    }
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    this.log('error', message, error);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
