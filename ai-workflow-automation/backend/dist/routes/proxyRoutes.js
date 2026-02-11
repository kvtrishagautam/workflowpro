"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
/**
 * HTTP Proxy endpoint for frontend workflows
 * Solves CORS issues by proxying requests through backend
 */
router.post('/api/proxy', async (req, res) => {
    try {
        const { url, method = 'GET', headers = {}, body } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        console.log(`[PROXY] ${method} ${url}`);
        const options = {
            method,
            headers: {
                'User-Agent': 'Workflow-Automation/1.0',
                ...headers,
            },
        };
        if (body && method !== 'GET' && method !== 'HEAD') {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
            if (!options.headers['Content-Type']) {
                options.headers['Content-Type'] = 'application/json';
            }
        }
        const response = await (0, node_fetch_1.default)(url, options);
        const contentType = response.headers.get('content-type');
        let data;
        if (contentType?.includes('application/json')) {
            data = await response.json();
        }
        else {
            data = await response.text();
        }
        res.status(response.status).json({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data,
        });
    }
    catch (error) {
        console.error('❌ [PROXY] Error:', error.message);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message,
        });
    }
});
exports.default = router;
