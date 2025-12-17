import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private isDevelopment = config.environment === 'development';

    private getTimestamp(): string {
        return new Date().toISOString();
    }

    private format(level: LogLevel, message: string, meta?: any): string {
        const timestamp = this.getTimestamp();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        if (meta) {
            return `${prefix} ${message} ${JSON.stringify(meta, null, 2)}`;
        }
        return `${prefix} ${message}`;
    }

    debug(message: string, meta?: any): void {
        if (this.isDevelopment || config.logging.level === 'debug') {
            console.log(this.format('debug', message, meta));
        }
    }

    info(message: string, meta?: any): void {
        console.log(this.format('info', message, meta));
    }

    warn(message: string, meta?: any): void {
        console.warn(this.format('warn', message, meta));
    }

    error(message: string, meta?: any): void {
        console.error(this.format('error', message, meta));
    }
}

export const logger = new Logger();
