import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import webhookRoutes from './routes/webhookRoutes';
import authRoutes from './routes/auth.routes';
import workflowRoutes from './routes/workflow.routes';
import { connectDatabase } from './config/database';
import { config } from './config/env';

// Import proxyRoutes if available (from origin/merge); gracefully skip if not present
let proxyRoutes: any = null;
try {
    proxyRoutes = require('./routes/proxyRoutes').default;
} catch {
    // proxyRoutes not available in this environment
}

const app = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
// Mount workflow management routes first
app.use('/api/workflows', workflowRoutes);
// Mount API routes under /api to match frontend client baseURL
app.use('/api', webhookRoutes);

// Mount proxy routes if available
if (proxyRoutes) {
    app.use(proxyRoutes);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        message: 'The requested endpoint does not exist'
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Helper function to start server
const startServer = async () => {
    try {
        await connectDatabase();

        app.listen(PORT, () => {
            console.log('\n🚀 ========================================');
            console.log(`   Webhook Backend Server Started`);
            console.log('   ========================================');
            console.log(`   📍 URL: http://localhost:${PORT}`);
            console.log(`   🏥 Health: http://localhost:${PORT}/api/health`);
            console.log(`   📝 Workflows: http://localhost:${PORT}/api/workflows`);
            console.log(`   🔔 Webhooks: http://localhost:${PORT}/api/webhook/*`);
            console.log(`   💾 DB: ${config.mongodbUri}`);
            console.log('   ========================================\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
