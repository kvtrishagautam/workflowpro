import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

export abstract class BaseService {
    protected serviceName: string;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }

    protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any) {
        const logMessage = `[${this.serviceName}] ${message}`;
        logger[level](logMessage, meta);
    }

    protected async handleError(error: any, context?: string): Promise<never> {
        const errorContext = context ? ` (${context})` : '';

        if (error instanceof ApiError) {
            this.log('warn', `API Error${errorContext}`, {
                code: error.code,
                message: error.message,
            });
            throw error;
        }

        this.log('error', `Unexpected error${errorContext}`, {
            message: error.message,
            stack: error.stack,
        });

        throw new ApiError(500, 'SERVICE_ERROR', `Service error in ${this.serviceName}${errorContext}`);
    }
}
