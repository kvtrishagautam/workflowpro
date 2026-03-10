import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import { nodeRegistry } from './services/nodeRegistry';
import { emailDiscoveryNode } from './nodes/emailDiscovery';
import { emailSendingNode } from './nodes/emailSending';
import { scheduledEmailNode } from './nodes/scheduledEmail.node';
import googleSheetsNode from './nodes/googleSheets.node';
import {
    webhookNode,
    javascriptNode,
    slackNode,
    httpNode,
    conditionalNode,
    delayNode
} from './nodes/foundationNodes';
import { csvReadNode } from './nodes/csvRead.node';
import { dataCleanerNode } from './nodes/dataCleaner.node';
import { analysisEngineNode } from './nodes/analysisEngine.node';
import { mongoDbStorageNode } from './nodes/mongoDbStorage.node';
import { connectToMongoDB } from './config/mongoClient';
import { jobScheduler } from './services/jobScheduler.service';
import { recipientGroupService } from './services/recipientGroup.service';
import { deliveryLogger } from './services/deliveryLogger.service';
import { DiscoveredEmail } from './models/DiscoveredEmail.model';
import { AnalysisResult } from './models/AnalysisResult.model';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve standalone dashboard HTML from project root
app.use(express.static(path.join(__dirname, '../../')));

// Initialize MongoDB and job scheduler
(async () => {
    try {
        await connectToMongoDB();
        await jobScheduler.initializeScheduler();
        console.log('✅ Database and scheduler initialized');
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
    }
})();

// Register all nodes
import { dashboardPortalNode } from './nodes/dashboardPortal.node';

console.log('Registering nodes...');
nodeRegistry.register(emailDiscoveryNode);
nodeRegistry.register(emailSendingNode);
nodeRegistry.register(scheduledEmailNode);
nodeRegistry.register(googleSheetsNode);
nodeRegistry.register(webhookNode);
nodeRegistry.register(javascriptNode);
nodeRegistry.register(slackNode);
nodeRegistry.register(httpNode);
nodeRegistry.register(conditionalNode);
nodeRegistry.register(delayNode);
nodeRegistry.register(csvReadNode);
nodeRegistry.register(dataCleanerNode);
nodeRegistry.register(analysisEngineNode);
nodeRegistry.register(mongoDbStorageNode);
nodeRegistry.register(dashboardPortalNode);
console.log('All nodes registered successfully!');

// API endpoint to list all available nodes
app.get('/api/nodes', (req, res) => {
    const nodes = nodeRegistry.getAll().map(node => ({
        id: node.id,
        type: node.type,
        name: node.name,
        description: node.description,
        inputSchema: node.inputSchema,
        outputSchema: node.outputSchema
    }));
    res.json({ nodes });
});

// API endpoint to list sample workflow templates
app.get('/api/sample-workflows', (req, res) => {
    try {
        const fs = require('fs');
        const samplesDir = path.join(__dirname, '../../sample-workflows');
        if (!fs.existsSync(samplesDir)) {
            return res.json({ workflows: [] });
        }
        const files = fs.readdirSync(samplesDir).filter((f: string) => f.endsWith('.json'));
        const workflows = files.map((f: string) => {
            const content = JSON.parse(fs.readFileSync(path.join(samplesDir, f), 'utf8'));
            return { id: content.id, name: content.name, description: content.description, file: f };
        });
        res.json({ workflows });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to load a specific sample workflow
app.get('/api/sample-workflows/:filename', (req, res) => {
    try {
        const fs = require('fs');
        const filePath = path.join(__dirname, '../../sample-workflows', req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Sample workflow not found' });
        }
        const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(workflow);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
// API endpoint to save a workflow
app.post('/api/workflows', async (req, res) => {
    try {
        const { name, description, nodes, edges } = req.body;

        if (!nodes || !Array.isArray(nodes)) {
            return res.status(400).json({ error: 'Invalid workflow: nodes array required' });
        }

        // For now, just return success - can add MongoDB model later
        const workflow = {
            id: Date.now().toString(),
            name: name || 'Untitled Workflow',
            description: description || '',
            nodes,
            edges: edges || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        res.json({
            message: 'Workflow saved successfully',
            workflow
        });
    } catch (error: any) {
        console.error('Workflow save error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to execute a workflow
app.post('/api/workflows/execute', async (req, res) => {
    try {
        const { nodes, edges } = req.body;

        if (!nodes || !Array.isArray(nodes)) {
            return res.status(400).json({ error: 'Invalid workflow: nodes array required' });
        }

        // --- Topological Sort ---
        const sortedNodes: string[] = [];
        const visited = new Set();
        const visiting = new Set();
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        // Build adjacency list
        const adj = new Map();
        nodes.forEach(n => adj.set(n.id, []));
        if (edges && Array.isArray(edges)) {
            edges.forEach(edge => {
                if (adj.has(edge.source)) {
                    adj.get(edge.source)!.push(edge.target);
                }
            });
        }

        const topoSort = (nodeId: string): void => {
            if (visiting.has(nodeId)) return; // Simple cycle detection or skip
            if (visited.has(nodeId)) return;

            visiting.add(nodeId);
            const neighbors = adj.get(nodeId) || [];
            for (const neighborId of neighbors) {
                topoSort(neighborId);
            }
            visiting.delete(nodeId);
            visited.add(nodeId);
            sortedNodes.unshift(nodeId); // Put at start
        };

        nodes.forEach(n => {
            if (!visited.has(n.id)) {
                topoSort(n.id);
            }
        });

        // The sort should be source -> target
        // Our DFS unshift gives us: if source -> target, target is pushed first, then source unshifted.
        // So source comes before target. Correct.

        const results = [];
        let previousOutput: any = {};

        // Execute nodes in sorted order
        for (const nodeId of sortedNodes) {
            const nodeConfig = nodeMap.get(nodeId);
            if (!nodeConfig) continue;

            const node = nodeRegistry.get(nodeConfig.type);

            if (!node) {
                return res.status(400).json({ error: `Unknown node type: ${nodeConfig.type}` });
            }

            // Merge: previous node output provides data context, node's own input (config) takes priority
            // This ensures the node's configured subject/body/etc are NOT overwritten by upstream data
            const input = { ...previousOutput, ...nodeConfig.input };

            console.log(`\n━━━ Executing node: ${node.name} (${nodeId}) ━━━`);
            console.log(`[Pipeline] Node type: ${nodeConfig.type}`);
            console.log(`[Pipeline] Node own input keys: [${Object.keys(nodeConfig.input || {}).join(', ')}]`);
            console.log(`[Pipeline] Previous output keys: [${Object.keys(previousOutput).join(', ')}]`);
            console.log(`[Pipeline] Merged input keys: [${Object.keys(input).join(', ')}]`);

            // Log specific data relevant to email workflow tracing
            if (input.emails) {
                console.log(`[Pipeline] emails array length: ${Array.isArray(input.emails) ? input.emails.length : 'NOT_ARRAY'}`);
            }
            if (input.subject) {
                console.log(`[Pipeline] subject: "${input.subject}"`);
            }

            const result = await node.execute(input);

            console.log(`[Pipeline] Result status: ${result.status}`);
            if (result.status === 'error') {
                console.error(`[Pipeline] ❌ Error: ${result.error}`);
            } else {
                console.log(`[Pipeline] Output keys: [${Object.keys(result.data || {}).join(', ')}]`);
            }

            results.push({
                nodeId: nodeConfig.id || node.id,
                nodeType: node.type,
                result
            });

            if (result.status === 'error') {
                return res.status(500).json({ error: result.error, results });
            }

            // Pass output to next node (simple sequential bypass for now)
            previousOutput = result.data || {};
        }

        // Strip large fields from response to prevent JSON serialization crash
        const leanResults = results.map(r => {
            if (r.result?.data) {
                const { rawRows, allResults, ...leanData } = r.result.data;
                return { ...r, result: { ...r.result, data: leanData } };
            }
            return r;
        });

        res.json({ status: 'success', results: leanResults });
    } catch (error: any) {
        console.error('Workflow execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Scheduled Jobs API Endpoints
app.get('/api/scheduled-jobs', async (req, res) => {
    try {
        const { status } = req.query;
        const jobs = await jobScheduler.getScheduledJobs(status as string);
        res.json({ jobs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/scheduled-jobs/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await jobScheduler.getJobById(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({ job });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Send Now endpoint - trigger immediate send for a scheduled job
app.post('/api/scheduled-jobs/:jobId/send-now', async (req, res) => {
    try {
        const { jobId } = req.params;
        const result = await jobScheduler.sendNow(jobId);

        if (result.success) {
            res.json({
                message: result.message,
                successCount: result.successCount,
                failureCount: result.failureCount
            });
        } else {
            res.status(400).json({ error: result.message });
        }
    } catch (error: any) {
        console.error('Error in send-now endpoint:', error);
        res.status(500).json({ error: error.message || 'Failed to send email' });
    }
});

// Stop/Cancel job endpoint - cancel a running scheduled job
app.post('/api/scheduled-jobs/:jobId/cancel', async (req, res) => {
    try {
        const { jobId } = req.params;
        await jobScheduler.cancelJob(jobId);
        res.json({ message: 'Job cancelled successfully' });
    } catch (error: any) {
        console.error('Error cancelling job:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel job' });
    }
});

// Recipient Groups API Endpoints
app.get('/api/recipient-groups', async (req, res) => {
    try {
        const groups = await recipientGroupService.getAllGroups();
        res.json({ groups });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/recipient-groups', async (req, res) => {
    try {
        const { name, emails } = req.body;

        if (!name || !emails || !Array.isArray(emails)) {
            return res.status(400).json({ error: 'Invalid input: name and emails array required' });
        }

        const group = await recipientGroupService.createGroup(name, emails);
        res.json({ group });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/recipient-groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, emails } = req.body;

        const group = await recipientGroupService.updateGroup(groupId, { name, emails });
        res.json({ group });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/recipient-groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        await recipientGroupService.deleteGroup(groupId);
        res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Delivery Logs API Endpoints
app.get('/api/delivery-logs', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const logs = await deliveryLogger.getAllLogs(limit);
        res.json({ logs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/delivery-logs/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        const logs = await deliveryLogger.getJobLogs(jobId);
        res.json({ logs });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Discovered Emails API Endpoints
app.get('/api/discovered-emails', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const status = req.query.status as string | undefined;

        const query = status ? { status } : {};
        const emails = await DiscoveredEmail.find(query)
            .sort({ discoveredAt: -1 })
            .limit(limit);

        res.json({
            emails,
            count: emails.length,
            total: await DiscoveredEmail.countDocuments(query)
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/discovered-emails/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const email = await DiscoveredEmail.findById(id);
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json({ email });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/discovered-emails/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await DiscoveredEmail.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json({ message: 'Email deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/discovered-emails/stats/summary', async (req, res) => {
    try {
        const total = await DiscoveredEmail.countDocuments();
        const pending = await DiscoveredEmail.countDocuments({ status: 'pending' });
        const sent = await DiscoveredEmail.countDocuments({ status: 'sent' });
        const failed = await DiscoveredEmail.countDocuments({ status: 'failed' });
        const skipped = await DiscoveredEmail.countDocuments({ status: 'skipped' });

        res.json({
            total,
            pending,
            sent,
            failed,
            skipped
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- NEW API ROUTES FOR ANALYSIS DASHBOARD ---

app.get('/api/analysis/results', async (req, res) => {
    try {
        const { category } = req.query;
        const query: any = {};
        if (category) query.category = category;

        // Fetch the 50 most recent
        const results = await AnalysisResult.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ results });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Returns all distinct categories with their most recent timestamp
app.get('/api/analysis/categories', async (req, res) => {
    try {
        const cats = await AnalysisResult.aggregate([
            { $group: { _id: '$category', lastRun: { $max: '$createdAt' }, count: { $sum: 1 } } },
            { $sort: { lastRun: -1 } },
            { $project: { category: '$_id', lastRun: 1, count: 1, _id: 0 } }
        ]);
        res.json({ categories: cats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analysis/results/latest', async (req, res) => {
    try {
        const { category } = req.query;
        const query: any = {};
        if (category) query.category = category;

        const result = await AnalysisResult.findOne(query)
            .sort({ createdAt: -1 });

        res.json({ result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
// ----------------------------------------------


// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Email Automation Backend is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Email Automation Backend running on http://localhost:${PORT}`);
    console.log(`📋 Available nodes: ${nodeRegistry.getAll().length}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /health - Health check`);
    console.log(`  GET  /api/nodes - List all nodes`);
    console.log(`  POST /api/workflows/execute - Execute workflow\n`);
});

// Prevent crashes from unhandled errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Uncaught Exception:', error);
});
