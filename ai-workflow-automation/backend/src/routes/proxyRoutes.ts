import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

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

        const options: any = {
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

        const response = await fetch(url, options);
        const contentType = response.headers.get('content-type');

        let data;
        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        res.status(response.status).json({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data,
        });

    } catch (error: any) {
        console.error('❌ [PROXY] Error:', error.message);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message,
        });
    }
});

export default router;
