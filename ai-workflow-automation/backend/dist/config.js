"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    // Server
    port: parseInt(process.env.PORT || '5000', 10),
    environment: (process.env.NODE_ENV || 'development'),
    // Database
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '27017', 10),
        name: process.env.DB_NAME || 'workflow_automation',
        username: process.env.DB_USERNAME || '',
        password: process.env.DB_PASSWORD || '',
        uri: process.env.MONGODB_URI || '',
    },
    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
    // API
    api: {
        prefix: '/api',
        version: 'v1',
    },
    // Features
    features: {
        emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
        apiKeyAuth: process.env.ENABLE_API_KEY_AUTH === 'true',
    },
};
