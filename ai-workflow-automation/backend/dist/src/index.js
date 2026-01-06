"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv = __importStar(require("dotenv"));
const nodeRegistry_1 = require("./services/nodeRegistry");
const emailDiscovery_1 = require("./nodes/emailDiscovery");
const emailSending_1 = require("./nodes/emailSending");
const foundationNodes_1 = require("./nodes/foundationNodes");
// Load environment variables
dotenv.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Register all nodes
console.log('Registering nodes...');
nodeRegistry_1.nodeRegistry.register(emailDiscovery_1.emailDiscoveryNode);
nodeRegistry_1.nodeRegistry.register(emailSending_1.emailSendingNode);
nodeRegistry_1.nodeRegistry.register(foundationNodes_1.webhookNode);
nodeRegistry_1.nodeRegistry.register(foundationNodes_1.javascriptNode);
nodeRegistry_1.nodeRegistry.register(foundationNodes_1.slackNode);
nodeRegistry_1.nodeRegistry.register(foundationNodes_1.httpNode);
nodeRegistry_1.nodeRegistry.register(foundationNodes_1.conditionalNode);
nodeRegistry_1.nodeRegistry.register(foundationNodes_1.delayNode);
console.log('All nodes registered successfully!');
// API endpoint to list all available nodes
app.get('/api/nodes', (req, res) => {
    const nodes = nodeRegistry_1.nodeRegistry.getAll().map(node => ({
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
        const sortedNodes = [];
        const visited = new Set();
        const visiting = new Set();
        const nodeMap = new Map(nodes.map(n => [n.id, n]));
        // Build adjacency list
        const adj = new Map();
        nodes.forEach(n => adj.set(n.id, []));
        if (edges && Array.isArray(edges)) {
            edges.forEach(edge => {
                if (adj.has(edge.source)) {
                    adj.get(edge.source).push(edge.target);
                }
            });
        }
        const topoSort = (nodeId) => {
            if (visiting.has(nodeId))
                return; // Simple cycle detection or skip
            if (visited.has(nodeId))
                return;
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
        let previousOutput = {};
        // Execute nodes in sorted order
        for (const nodeId of sortedNodes) {
            const nodeConfig = nodeMap.get(nodeId);
            if (!nodeConfig)
                continue;
            const node = nodeRegistry_1.nodeRegistry.get(nodeConfig.type);
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
    }
    catch (error) {
        console.error('Workflow execution error:', error);
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
    console.log(`📋 Available nodes: ${nodeRegistry_1.nodeRegistry.getAll().length}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET  /health - Health check`);
    console.log(`  GET  /api/nodes - List all nodes`);
    console.log(`  POST /api/workflows/execute - Execute workflow\n`);
});
