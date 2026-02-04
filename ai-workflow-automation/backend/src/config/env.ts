import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation',
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    slackBotToken: process.env.SLACK_BOT_TOKEN,
    apiKeyLength: parseInt(process.env.API_KEY_LENGTH || '32'),
};
