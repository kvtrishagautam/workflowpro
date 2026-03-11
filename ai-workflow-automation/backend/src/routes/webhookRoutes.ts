import { Router, Request, Response } from 'express';
import { findWorkflowByWebhook, saveWorkflow, getAllWorkflows } from '../store/workflowStore';
import { executeWorkflow, WebhookExecutionContext } from '../services/executionService';
import { WorkflowService } from '../services/workflowService';
import { WebhookConfig, WebhookAuthType } from '../types/workflow';

const router = Router();

// Bot detection user agents
const BOT_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
    'slackbot', 'twitterbot', 'facebookexternalhit', 'linkedinbot',
    'googlebot', 'bingbot', 'yandexbot', 'baiduspider'
];

// Helper: Check if request is from a bot
function isBot(userAgent: string | undefined): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    return BOT_USER_AGENTS.some(bot => ua.includes(bot));
}

// Helper: Check IP whitelist
function isIpAllowed(clientIp: string, whitelist: string | undefined): boolean {
    if (!whitelist || whitelist.trim() === '') return true;

    const allowedIps = whitelist.split(',').map(ip => ip.trim());
    return allowedIps.some(allowed => {
        // Simple IP match (can be enhanced for CIDR support)
        if (allowed.includes('/')) {
            // Basic CIDR support for /24, /16, /8
            const [network, bits] = allowed.split('/');
            const networkParts = network.split('.');
            const clientParts = clientIp.split('.');
            const maskBits = parseInt(bits);
            const octets = Math.floor(maskBits / 8);

            for (let i = 0; i < octets; i++) {
                if (networkParts[i] !== clientParts[i]) return false;
            }
            return true;
        }
        return allowed === clientIp;
    });
}

// Helper: Validate Basic Auth
function validateBasicAuth(req: Request, credentials: { username: string; password: string }): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) return false;

    const base64Credentials = authHeader.slice(6);
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    return username === credentials.username && password === credentials.password;
}

// Helper: Validate Header Auth
function validateHeaderAuth(req: Request, credentials: { headerName: string; headerValue: string }): boolean {
    const headerValue = req.headers[credentials.headerName.toLowerCase()];
    return headerValue === credentials.headerValue;
}

// Helper: Set CORS headers
function setCorsHeaders(res: Response, allowedOrigins: string | undefined, req: Request): void {
    const origin = req.headers.origin;

    if (!allowedOrigins || allowedOrigins === '*') {
        res.header('Access-Control-Allow-Origin', '*');
    } else {
        const origins = allowedOrigins.split(',').map(o => o.trim());
        if (origin && origins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
}

// Helper: Get client IP
function getClientIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || '';
}

// CORS preflight handler for webhooks
router.options('/webhook/*', (req: Request, res: Response) => {
    setCorsHeaders(res, '*', req);
    res.sendStatus(204);
});

// Test webhook endpoint (for development/testing)
router.all('/webhook/test/*', async (req: Request, res: Response) => {
    try {
        const path = '/' + (req.params[0] || '');
        const method = req.method;

        console.log(`\n🧪 TEST Webhook received: ${method} ${path}`);
        console.log(`📦 Payload:`, JSON.stringify(req.body, null, 2));
        console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2));

        const workflow = findWorkflowByWebhook(path, method);

        if (!workflow) {
            return res.status(404).json({
                error: 'No workflow found for this webhook',
                path,
                method,
                hint: 'Make sure you have saved a workflow with this webhook path'
            });
        }

        // For test webhooks, always respond immediately with debug info
        res.json({
            status: 'Test webhook received',
            workflowId: workflow.id,
            receivedData: {
                path,
                method,
                body: req.body,
                query: req.query,
                headers: {
                    'content-type': req.headers['content-type'],
                    'user-agent': req.headers['user-agent'],
                    'authorization': req.headers.authorization ? '***' : undefined,
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('❌ Test webhook error:', error);
        res.status(500).json({
            error: 'Test webhook failed',
            message: error.message
        });
    }
});

// Dynamic webhook endpoint - handles all webhook paths
router.all('/webhook/*', async (req: Request, res: Response) => {
    try {
        const path = '/' + (req.params[0] || '');
        const method = req.method;

        console.log(`\n🔔 Webhook received: ${method} ${path}`);
        console.log(`📦 Payload:`, JSON.stringify(req.body, null, 2));

        const workflow = findWorkflowByWebhook(path, method);

        if (!workflow) {
            console.log(`❌ No workflow found for webhook: ${method} ${path}`);
            return res.status(404).json({
                error: 'No workflow found for this webhook',
                path,
                method
            });
        }

        console.log(`✅ Found workflow: ${workflow.id}`);

        // Get webhook node configuration
        const webhookNode = workflow.nodes.find(n => n.type === 'webhook');
        const webhookConfig: Partial<WebhookConfig> = webhookNode?.config || {};

        // Set CORS headers
        setCorsHeaders(res, webhookConfig.options?.allowedOrigins, req);

        // Check for bots
        if (webhookConfig.options?.ignoreBots && isBot(req.headers['user-agent'])) {
            console.log(`🤖 Bot request ignored`);
            return res.status(200).send('OK');
        }

        // Check IP whitelist
        const clientIp = getClientIp(req);
        if (!isIpAllowed(clientIp, webhookConfig.options?.ipWhitelist)) {
            console.log(`🚫 IP not allowed: ${clientIp}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        // Validate authentication
        if (webhookConfig.authentication === 'basicAuth' && webhookConfig.basicAuthCredentials) {
            if (!validateBasicAuth(req, webhookConfig.basicAuthCredentials)) {
                console.log(`🔐 Basic auth failed`);
                res.setHeader('WWW-Authenticate', 'Basic realm="Webhook"');
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        if (webhookConfig.authentication === 'headerAuth' && webhookConfig.headerAuthCredentials) {
            if (!validateHeaderAuth(req, webhookConfig.headerAuthCredentials)) {
                console.log(`🔐 Header auth failed`);
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        // Prepare execution context
        const executionContext: WebhookExecutionContext = {
            webhookConfig,
            request: {
                body: req.body,
                query: req.query as Record<string, string>,
                params: req.params,
                headers: req.headers as Record<string, string>,
                method,
                path,
                ip: clientIp,
            }
        };

        // Handle response based on responseMode
        const responseMode = webhookConfig.responseMode || 'immediately';
        const responseCode = webhookConfig.responseCode || 200;
        const contentType = webhookConfig.options?.responseContentType || 'application/json';

        if (responseMode === 'immediately') {
            // Respond immediately, execute workflow in background
            const immediateResponse = webhookConfig.options?.customResponseData
                ? JSON.parse(webhookConfig.options.customResponseData)
                : { status: 'Workflow triggered', workflowId: workflow.id };

            // Set response headers
            if (webhookConfig.options?.responseHeaders) {
                Object.entries(webhookConfig.options.responseHeaders).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
            }

            res.status(responseCode).contentType(contentType).json(immediateResponse);

            // Execute workflow in background (don't await)
            executeWorkflow(workflow, req.body, executionContext)
                .then(result => console.log(`✅ Workflow ${workflow.id} completed:`, result))
                .catch(err => console.error(`❌ Workflow ${workflow.id} failed:`, err));

        } else if (responseMode === 'lastNode') {
            // Wait for workflow to complete and return result
            const result = await executeWorkflow(workflow, req.body, executionContext);

            // Set response headers
            if (webhookConfig.options?.responseHeaders) {
                Object.entries(webhookConfig.options.responseHeaders).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
            }

            // Handle different response data modes
            const responseData = webhookConfig.responseData || 'firstEntryJson';

            if (webhookConfig.options?.noResponseBody || responseData === 'noResponseBody') {
                res.status(responseCode).end();
            } else if (responseData === 'allEntries') {
                res.status(responseCode).contentType(contentType).json(result);
            } else if (responseData === 'firstEntryJson') {
                const firstEntry = Array.isArray(result) ? result[0] : result;
                if (webhookConfig.options?.propertyName && firstEntry) {
                    res.status(responseCode).contentType(contentType).json(firstEntry[webhookConfig.options.propertyName]);
                } else {
                    res.status(responseCode).contentType(contentType).json(firstEntry);
                }
            } else {
                res.status(responseCode).contentType(contentType).json(result);
            }
        } else {
            // responseNode mode - execute and let a Respond to Webhook node handle the response
            // For now, fall back to immediate response
            res.status(responseCode).json({
                status: 'Workflow triggered',
                workflowId: workflow.id,
                note: 'Response Node mode - workflow will send custom response'
            });

            executeWorkflow(workflow, req.body, executionContext)
                .then(result => console.log(`✅ Workflow ${workflow.id} completed`))
                .catch(err => console.error(`❌ Workflow ${workflow.id} failed:`, err));
        }
    } catch (error: any) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({
            error: 'Webhook execution failed',
            message: error.message
        });
    }
});

// Save workflow endpoint
router.post('/workflows', async (req: Request, res: Response) => {
    try {
        const workflow = req.body;

        console.log(`\n💾 Saving workflow: ${workflow.id}`);

        // Validate workflow
        WorkflowService.validateWorkflow(workflow);

        saveWorkflow(workflow);

        // Log webhook endpoints
        const webhookNodes = workflow.nodes.filter((n: any) => n.type === 'webhook');
        if (webhookNodes.length > 0) {
            console.log('📍 Registered webhook endpoints:');
            webhookNodes.forEach((node: any) => {
                // Support both React Flow structure (node.data.config) and direct structure (node.config)
                const config = node.data?.config || node.config || {};
                const method = config.httpMethod || config.method || 'POST';
                const path = config.path || '/webhook';
                console.log(`   ${method} /webhook${path}`);
                if (config.authentication && config.authentication !== 'none') {
                    console.log(`      🔐 Auth: ${config.authentication}`);
                }
            });
        }

        res.json({
            status: 'saved',
            workflowId: workflow.id,
            webhooks: webhookNodes.map((n: any) => {
                const config = n.data?.config || n.config || {};
                return {
                    method: config.httpMethod || config.method || 'POST',
                    path: `/webhook${config.path}`,
                    testPath: `/webhook/test${config.path}`,
                    authentication: config.authentication || 'none'
                };
            })
        });
    } catch (error: any) {
        console.error('❌ Save workflow error:', error);
        res.status(400).json({
            error: 'Failed to save workflow',
            message: error.message
        });
    }
});

// Get all workflows
router.get('/workflows', (req: Request, res: Response) => {
    const workflows = getAllWorkflows();
    res.json({
        count: workflows.length,
        workflows
    });
});

// Execute workflow endpoint (for direct execution without webhook)
router.post('/api/workflows/execute', async (req: Request, res: Response) => {
    try {
        const workflow = req.body;

        console.log(`\n🚀 Direct execution request for workflow: ${workflow.id || 'unnamed'}`);

        // Validate workflow has nodes
        if (!workflow.nodes || workflow.nodes.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Workflow has no nodes'
            });
        }

        // Execute workflow with empty payload (can be customized if needed)
        const result = await executeWorkflow(workflow, {});

        console.log(`✅ Workflow execution completed`);

        res.json({
            status: 'success',
            result
        });
    } catch (error: any) {
        console.error('❌ Workflow execution error:', error);
        res.status(500).json({
            status: 'error',
            error: error.message || 'Workflow execution failed'
        });
    }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'webhook-backend'
    });
});

export default router;
