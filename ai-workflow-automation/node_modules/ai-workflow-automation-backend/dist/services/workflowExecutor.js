"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowExecutor = exports.WorkflowExecutor = void 0;
const baseService_1 = require("./baseService");
class WorkflowExecutor extends baseService_1.BaseService {
    constructor() {
        super('WorkflowExecutor');
        this.nodeRegistry = new Map();
        this.initializeNodeRegistry();
    }
    initializeNodeRegistry() {
        // Register built-in node types
        this.registerNodeType('webhook', this.executeWebhookNode.bind(this));
        this.registerNodeType('javascript', this.executeJavaScriptNode.bind(this));
        this.registerNodeType('slack', this.executeSlackNode.bind(this));
        this.registerNodeType('http', this.executeHttpNode.bind(this));
        this.registerNodeType('conditional', this.executeConditionalNode.bind(this));
        this.log('info', 'Node registry initialized with built-in node types');
    }
    registerNodeType(type, executor) {
        this.nodeRegistry.set(type, executor);
        this.log('debug', `Registered node type: ${type}`);
    }
    async executeWorkflow(definition, initialInput = {}) {
        const startTime = Date.now();
        const results = new Map();
        const nodeIndex = this.buildNodeIndex(definition.nodes);
        try {
            this.log('info', 'Starting workflow execution', { nodeCount: definition.nodes.length });
            // Build execution order (topological sort)
            const executionOrder = this.getExecutionOrder(definition.nodes, definition.edges);
            this.log('debug', 'Execution order determined', { order: executionOrder });
            // Execute nodes in order
            for (const nodeId of executionOrder) {
                const node = nodeIndex.get(nodeId);
                if (!node) {
                    throw new Error(`Node ${nodeId} not found in workflow definition`);
                }
                const context = {
                    nodeId,
                    nodeType: node.type,
                    input: this.gatherNodeInputs(nodeId, definition.edges, results),
                    config: node.config,
                    previousResults: Object.fromEntries(results),
                };
                const result = await this.executeNode(context);
                if (result.status === 'error') {
                    this.log('error', `Node execution failed: ${nodeId}`, { error: result.error });
                    return {
                        status: 'failed',
                        results,
                        error: result.error,
                    };
                }
                results.set(nodeId, result.output);
                this.log('debug', `Node executed successfully: ${nodeId}`, {
                    executionTime: result.executionTime,
                });
            }
            const executionTime = Date.now() - startTime;
            this.log('info', 'Workflow execution completed', { executionTime });
            return {
                status: 'completed',
                results,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.log('error', 'Workflow execution failed', {
                error: error.message,
                executionTime,
            });
            return {
                status: 'failed',
                results,
                error: error.message,
            };
        }
    }
    async executeNode(context) {
        const startTime = Date.now();
        const executor = this.nodeRegistry.get(context.nodeType);
        if (!executor) {
            return {
                nodeId: context.nodeId,
                status: 'error',
                output: {},
                error: `Unknown node type: ${context.nodeType}`,
                executionTime: Date.now() - startTime,
            };
        }
        try {
            const output = await executor(context);
            return {
                nodeId: context.nodeId,
                status: 'success',
                output,
                executionTime: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                nodeId: context.nodeId,
                status: 'error',
                output: {},
                error: error.message,
                executionTime: Date.now() - startTime,
            };
        }
    }
    // Built-in node executors
    async executeWebhookNode(context) {
        this.log('debug', 'Executing webhook node', { webhookUrl: context.config.url });
        // Placeholder implementation
        return {
            webhookId: context.config.id,
            timestamp: new Date().toISOString(),
            data: context.input,
        };
    }
    async executeJavaScriptNode(context) {
        this.log('debug', 'Executing JavaScript node');
        // Placeholder - in production, use a sandboxed environment
        try {
            const fn = new Function('input', `return ${context.config.code}`);
            return await fn(context.input);
        }
        catch (error) {
            throw new Error(`JavaScript execution error: ${error.message}`);
        }
    }
    async executeSlackNode(context) {
        this.log('debug', 'Executing Slack node', { channel: context.config.channel });
        // Placeholder - integrate with Slack API
        return {
            slackMessageId: 'msg_' + Math.random().toString(36),
            sent: true,
            timestamp: new Date().toISOString(),
        };
    }
    async executeHttpNode(context) {
        this.log('debug', 'Executing HTTP node', { url: context.config.url, method: context.config.method });
        // Placeholder - would call actual HTTP request
        return {
            statusCode: 200,
            headers: {},
            body: {},
        };
    }
    async executeConditionalNode(context) {
        this.log('debug', 'Executing conditional node');
        // Evaluate condition
        return {
            result: true,
            branch: 'then',
        };
    }
    buildNodeIndex(nodes) {
        const index = new Map();
        for (const node of nodes) {
            index.set(node.id, node);
        }
        return index;
    }
    getExecutionOrder(nodes, edges) {
        // Simple topological sort
        const visited = new Set();
        const order = [];
        const adjList = new Map();
        // Build adjacency list
        for (const node of nodes) {
            adjList.set(node.id, []);
        }
        for (const edge of edges) {
            adjList.get(edge.source)?.push(edge.target);
        }
        // DFS for topological sort
        const visit = (nodeId) => {
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            for (const neighbor of adjList.get(nodeId) || []) {
                visit(neighbor);
            }
            order.push(nodeId);
        };
        for (const node of nodes) {
            visit(node.id);
        }
        return order.reverse();
    }
    gatherNodeInputs(nodeId, edges, results) {
        const inputs = {};
        for (const edge of edges) {
            if (edge.target === nodeId) {
                inputs[edge.source] = results.get(edge.source) || null;
            }
        }
        return inputs;
    }
}
exports.WorkflowExecutor = WorkflowExecutor;
exports.workflowExecutor = new WorkflowExecutor();
