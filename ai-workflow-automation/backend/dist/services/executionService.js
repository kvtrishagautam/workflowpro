"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflow = executeWorkflow;
const nodeExecutor_1 = require("./nodeExecutor");
async function executeWorkflow(workflow, payload, context) {
    console.log(`🚀 Executing workflow ${workflow.id} with payload:`, JSON.stringify(payload, null, 2));
    if (context) {
        console.log(`📋 Webhook context:`, {
            method: context.request.method,
            path: context.request.path,
            ip: context.request.ip,
            authentication: context.webhookConfig.authentication,
            responseMode: context.webhookConfig.responseMode,
        });
    }
    const webhookNode = workflow.nodes.find(node => node.type === 'webhook');
    if (webhookNode) {
        // Support both React Flow structure (node.data.config) and direct structure (node.config)
        const config = webhookNode.data?.config || webhookNode.config || {};
        const method = config.httpMethod || config.method || 'POST';
        console.log(`✅ Webhook triggered: ${config.path} [${method}]`);
    }
    // Log all nodes in the workflow
    console.log(`📋 Workflow has ${workflow.nodes.length} nodes:`);
    workflow.nodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.type} (${node.id})`);
    });
    // Execute workflow nodes
    console.log(`\n🚀 Starting workflow execution...`);
    // Build node map for quick lookup
    const nodeMap = new Map();
    workflow.nodes.forEach(node => nodeMap.set(node.id, node));
    // Build edge map (node -> next nodes)
    const edgeMap = new Map();
    workflow.edges.forEach((edge) => {
        const source = edge.source;
        const target = edge.target;
        if (!edgeMap.has(source)) {
            edgeMap.set(source, []);
        }
        edgeMap.get(source).push(target);
    });
    // Find starting node (webhook node)
    const startNode = workflow.nodes.find(node => node.type === 'webhook');
    if (!startNode) {
        throw new Error('No webhook trigger node found in workflow');
    }
    // Execute nodes in order following edges
    let currentData = payload;
    const executedNodes = [];
    const nodesToExecute = [startNode.id];
    while (nodesToExecute.length > 0) {
        const nodeId = nodesToExecute.shift();
        // Skip if already executed (handle loops)
        if (executedNodes.includes(nodeId)) {
            continue;
        }
        const node = nodeMap.get(nodeId);
        if (!node) {
            console.warn(`⚠️  Node ${nodeId} not found, skipping`);
            continue;
        }
        try {
            // Execute the node
            currentData = await (0, nodeExecutor_1.executeNode)(node, currentData);
            executedNodes.push(nodeId);
            // Add next nodes to queue
            const nextNodes = edgeMap.get(nodeId) || [];
            nodesToExecute.push(...nextNodes);
        }
        catch (error) {
            console.error(`❌ Error executing node ${node.type} (${nodeId}):`, error);
            throw error;
        }
    }
    console.log(`\n✅ Workflow execution complete! Executed ${executedNodes.length} nodes`);
    // Build the execution result with webhook data included
    const executionResult = {
        status: 'success',
        workflowId: workflow.id,
        executedAt: new Date().toISOString(),
        executedNodes: executedNodes.length,
        payload,
        result: currentData,
    };
    // If we have context, include webhook-specific data
    if (context) {
        executionResult.webhookData = {
            method: context.request.method,
            path: context.request.path,
            query: context.request.query,
            headers: {
                'content-type': context.request.headers['content-type'],
                'user-agent': context.request.headers['user-agent'],
            },
            body: context.request.body,
        };
    }
    return executionResult;
}
