"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const config_1 = require("../config");
class Logger {
    constructor() {
        this.isDevelopment = config_1.config.environment === 'development';
    }
    getTimestamp() {
        return new Date().toISOString();
    }
    format(level, message, meta) {
        const timestamp = this.getTimestamp();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        if (meta) {
            return `${prefix} ${message} ${JSON.stringify(meta, null, 2)}`;
        }
        return `${prefix} ${message}`;
    }
    debug(message, meta) {
        if (this.isDevelopment || config_1.config.logging.level === 'debug') {
            console.log(this.format('debug', message, meta));
        }
    }
    info(message, meta) {
        console.log(this.format('info', message, meta));
    }
    warn(message, meta) {
        console.warn(this.format('warn', message, meta));
    }
    error(message, meta) {
        console.error(this.format('error', message, meta));
    }
}
exports.logger = new Logger();
