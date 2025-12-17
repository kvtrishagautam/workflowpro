"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class BaseService {
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    log(level, message, meta) {
        const logMessage = `[${this.serviceName}] ${message}`;
        logger_1.logger[level](logMessage, meta);
    }
    async handleError(error, context) {
        const errorContext = context ? ` (${context})` : '';
        if (error instanceof errors_1.ApiError) {
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
        throw new errors_1.ApiError(500, 'SERVICE_ERROR', `Service error in ${this.serviceName}${errorContext}`);
    }
}
exports.BaseService = BaseService;
