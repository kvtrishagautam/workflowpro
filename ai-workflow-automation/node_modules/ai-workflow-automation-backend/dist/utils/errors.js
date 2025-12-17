"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = exports.sendError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ApiError = void 0;
const logger_1 = require("./logger");
class ApiError extends Error {
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
class ValidationError extends ApiError {
    constructor(message, details) {
        super(400, 'VALIDATION_ERROR', message, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ApiError {
    constructor(resource, id) {
        const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
        super(404, 'NOT_FOUND', message);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends ApiError {
    constructor(message, details) {
        super(409, 'CONFLICT', message, details);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
function sendError(res, error) {
    if (error instanceof ApiError) {
        logger_1.logger.error(`API Error [${error.code}]`, {
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
    logger_1.logger.error('Unexpected error', {
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
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
    });
}
exports.sendSuccess = sendSuccess;
