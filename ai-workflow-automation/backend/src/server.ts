import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import webhookRoutes from './routes/webhookRoutes';

const app = express();
const PORT = 4000;

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
app.use(webhookRoutes);

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

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log(`   Webhook Backend Server Started`);
    console.log('   ========================================');
    console.log(`   📍 URL: http://localhost:${PORT}`);
    console.log(`   🏥 Health: http://localhost:${PORT}/health`);
    console.log(`   📝 Workflows: http://localhost:${PORT}/workflows`);
    console.log(`   🔔 Webhooks: http://localhost:${PORT}/webhook/*`);
    console.log('   ========================================\n');
});

export default app;
