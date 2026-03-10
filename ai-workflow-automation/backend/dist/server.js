"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const proxyRoutes_1 = __importDefault(require("./routes/proxyRoutes"));
const app = (0, express_1.default)();
const PORT = 4000;
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});
// Routes
app.use(webhookRoutes_1.default);
app.use(proxyRoutes_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        path: req.path,
        message: 'The requested endpoint does not exist'
    });
});
// Error handler
app.use((err, req, res, next) => {
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
exports.default = app;
