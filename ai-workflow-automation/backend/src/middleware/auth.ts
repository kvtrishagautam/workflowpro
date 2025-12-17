import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { AuthPayload } from '../types/config';
import { logger } from '../utils/logger';

declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
            userId?: string;
        }
    }
}

export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new UnauthorizedError('No authentication token provided');
        }

        // TODO: Verify JWT token using jwt.verify()
        // For now, placeholder
        logger.debug('Token validated');

        // You would decode the token here and attach user data to request
        // const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
        // req.user = decoded;
        // req.userId = decoded.userId;

        next();
    } catch (error: any) {
        logger.warn('Authentication failed', { error: error.message });
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: error.message,
            },
        });
    }
}

export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    logger.error('Error handler caught exception', {
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
    } else {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    }
}
