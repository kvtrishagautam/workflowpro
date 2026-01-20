import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { nodeRegistry } from './services/nodeRegistry';
import { emailDiscoveryNode } from './nodes/emailDiscovery';
import { emailSendingNode } from './nodes/emailSending';
import { scheduledEmailNode } from './nodes/scheduledEmailNode';
import {
    webhookNode,
    javascriptNode,
    slackNode,
    httpNode,
    conditionalNode,
    delayNode
} from './nodes/foundationNodes';
import { jobScheduler } from './services/jobScheduler';
import { recipientGroupService } from './services/recipientGroupService';
import { deliveryLogger } from './services/deliveryLogger';
import { initializeDatabase } from './services/supabaseClient';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database and job scheduler
(async () => {
    try {
        await initializeDatabase();
        await jobScheduler.initializeScheduler();
        console.log('✅ Database and scheduler initialized');
    } catch (error) {
        console.error('❌ Failed to initialize:', error);
    }
})();

// Register all nodes
console.log('Registering nodes...');
nodeRegistry.register(emailDiscoveryNode);
nodeRegistry.register(emailSendingNode);
nodeRegistry.register(scheduledEmailNode);
nodeRegistry.register(webhookNode);
nodeRegistry.register(javascriptNode);
nodeRegistry.register(slackNode);
nodeRegistry.register(httpNode);
nodeRegistry.register(conditionalNode);
nodeRegistry.register(delayNode);
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

            // Merge previous output with current input
            // Note: In a more complex graph, we'd merge outputs from all predecessors
            const input = { ...nodeConfig.input, ...previousOutput };

            console.log(`Executing node: ${node.name} (${nodeId})`);
            const result = await node.execute(input);

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

        res.json({ status: 'success', results });
    } catch (error: any) {
        console.error('Workflow execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Scheduled Jobs API Endpoints
app.get('/api/scheduled-jobs', async (req, res) => {
    try {
        const { status } = req.query;
        const jobs = await jobScheduler.getScheduledJobs(status as any);
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

app.post('/api/scheduled-jobs/:jobId/cancel', async (req, res) => {
    try {
        const { jobId } = req.params;
        await jobScheduler.cancelJob(jobId);
        res.json({ message: 'Job cancelled successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
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
