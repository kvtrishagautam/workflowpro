"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.authenticateToken = exports.asyncHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
exports.asyncHandler = asyncHandler;
function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            throw new errors_1.UnauthorizedError('No authentication token provided');
        }
        // TODO: Verify JWT token using jwt.verify()
        // For now, placeholder
        logger_1.logger.debug('Token validated');
        // You would decode the token here and attach user data to request
        // const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        // req.user = decoded;
        // req.userId = decoded.userId;
        next();
    }
    catch (error) {
        logger_1.logger.warn('Authentication failed', { error: error.message });
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: error.message,
            },
        });
    }
}
exports.authenticateToken = authenticateToken;
function errorHandler(err, req, res, next) {
    logger_1.logger.error('Error handler caught exception', {
        message: err.message,
        path: req.path,
        method: req.method,
    });
    if (err.statusCode) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code || 'ERROR',
                message: err.message,
            },
        });
    }
    else {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    }
}
exports.errorHandler = errorHandler;
