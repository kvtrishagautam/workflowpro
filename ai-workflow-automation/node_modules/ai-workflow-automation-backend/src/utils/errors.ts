import { Response } from 'express';
import { logger } from './logger';

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export class ValidationError extends ApiError {
    constructor(message: string, details?: any) {
        super(400, 'VALIDATION_ERROR', message, details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends ApiError {
    constructor(resource: string, id?: string) {
        const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        super(404, 'NOT_FOUND', message);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
        this.name = 'ForbiddenError';
    }
}

export class ConflictError extends ApiError {
    constructor(message: string, details?: any) {
        super(409, 'CONFLICT', message, details);
        this.name = 'ConflictError';
    }
}

export function sendError(res: Response, error: any): Response {
    if (error instanceof ApiError) {
        logger.error(`API Error [${error.code}]`, {
            statusCode: error.statusCode,
            message: error.message,
            details: error.details,
        });

        return res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                ...(error.details && { details: error.details }),
            },
            timestamp: new Date().toISOString(),
        });
    }

    // Handle unexpected errors
    logger.error('Unexpected error', {
        message: error.message,
        stack: error.stack,
    });

    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
    });
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
    return res.status(statusCode).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
    });
}
