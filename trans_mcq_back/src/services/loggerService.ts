// src/services/loggerService.ts
import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
}

class Logger {
  private logFile: string;

  constructor() {
    const date = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logsDir, `app-${date}.log`);
  }

  private writeLog(entry: LogEntry): void {
    try {
      const logMessage = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logMessage, 'utf8');
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${entry.level}] ${entry.message}`, entry.context || '');
      }
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context
    });
  }

  info(message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context
    });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context
    });
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const context = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;

    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

export default new Logger();
