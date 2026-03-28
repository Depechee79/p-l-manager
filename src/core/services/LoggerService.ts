/**
 * Logger Service
 * Centralizes logging to allow environment-based filtering and external reporting.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class LoggerService {
    private isDev: boolean;

    constructor() {
        // Detect environment (assuming Vite env vars, fallback to checking window)
        this.isDev = import.meta.env?.DEV || false;
    }

    private formatMessage(level: LogLevel, message: string, ...args: unknown[]) {
        const timestamp = new Date().toISOString();
        return [`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args];
    }

    debug(message: string, ...args: unknown[]) {
        if (this.isDev) {
            console.debug(...this.formatMessage('debug', message, ...args));
        }
    }

    info(message: string, ...args: unknown[]) {
        console.info(...this.formatMessage('info', message, ...args));
    }

    warn(message: string, ...args: unknown[]) {
        console.warn(...this.formatMessage('warn', message, ...args));
    }

    error(message: string, ...args: unknown[]) {
        console.error(...this.formatMessage('error', message, ...args));
    }
}

export const logger = new LoggerService();
