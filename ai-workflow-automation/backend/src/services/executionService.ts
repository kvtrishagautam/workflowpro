import { Workflow, WebhookConfig, WorkflowNodeData, WorkflowEdge } from '../types/workflow';
import { slackExecutor } from '../executors/slack.executor';
import { conditionExecutor } from '../executors/condition.executor';
import { filterExecutor } from '../executors/filter.executor';
import { googleSheetsExecutor } from '../executors/googleSheets.executor';
import { emailExecutor } from '../executors/email.executor';
import { whatsappExecutor } from '../executors/whatsapp.executor';
import { httpExecutor } from '../executors/http.executor';
import { delayExecutor } from '../executors/delay.executor';
import { databaseExecutor } from '../executors/database.executor';
import { javascriptExecutor } from '../executors/javascript.executor';
import { setExecutor } from '../executors/set.executor';
import { discordExecutor } from '../executors/discord.executor';
import { ExecutionContext, ExecutionResult, WorkflowNode } from '../types';
import { WorkflowExecution } from '../models/WorkflowExecution';

// Webhook execution context - contains request data and webhook configuration
export interface WebhookExecutionContext {
    webhookConfig: Partial<WebhookConfig>;
    request: {
        body: any;
        query: Record<string, string>;
        params: Record<string, string>;
        headers: Record<string, string>;
        method: string;
        path: string;
        ip: string;
    };
}

export async function executeWorkflow(
    workflow: Workflow,
    payload: any,
    context?: WebhookExecutionContext
): Promise<any> {
    console.log(
        `🚀 Executing workflow ${workflow.id} with payload:`,
        JSON.stringify(payload, null, 2)
    );

    // Log webhook context if provided (from origin/merge)
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
        const config = (webhookNode as any).data?.config || (webhookNode as any).config || {};
        const method = config.httpMethod || config.method || 'POST';
        console.log(`✅ Webhook triggered: ${config.path} [${method}]`);
    }

    // Create execution record
    const execution = new WorkflowExecution({
        workflowId: workflow._id || workflow.id,
        status: 'running',
        startedAt: new Date(),
        logs: [],
        inputData: payload
    });

    try {
        await execution.save();
    } catch (saveError) {
        console.error('Failed to create execution record:', saveError);
    }

    const results: Record<string, any> = {};
    const executionLogs: any[] = [];

    try {
        // Convert WorkflowNodeData to WorkflowNode (adapting types)
        const nodes: WorkflowNode[] = workflow.nodes.map(n => ({
            id: n.id,
            type: n.type as any,
            data: {
                config: n.data?.config || (n as any).config || {},
                label: n.data?.label || n.type
            },
            position: { x: 0, y: 0 }
        }));

        // Use edges from workflow
        const edges: WorkflowEdge[] = workflow.edges ? workflow.edges.map(e => ({
            id: (e as any).id || `${e.source}-${e.target}`,
            source: e.source,
            target: e.target,
            sourceHandle: (e as any).sourceHandle,
            targetHandle: (e as any).targetHandle
        })) : [];

        // Sort nodes topologically
        const sortedNodes = topologicalSort(nodes, edges);

        // Initial output from trigger
        let previousOutput = payload;

        // Execute nodes in order
        const skippedNodes = new Set<string>();

        for (const node of sortedNodes) {
            if (skippedNodes.has(node.id)) {
                console.log(`⏭️ Skipping node: ${node.type} (${node.id})`);
                executionLogs.push({
                    nodeId: node.id,
                    type: node.type,
                    success: true,
                    result: { success: true, data: null, skipped: true },
                    message: 'Skipped due to condition'
                });
                // Propagate skip to children
                const childEdges = edges.filter(e => e.source === node.id);
                childEdges.forEach(e => {
                    console.log(`⏭️ cascading skip to child node: ${e.target}`);
                    skippedNodes.add(e.target);
                });
                continue;
            }

            console.log(`▶️ Executing node: ${node.type} (${node.id})`);

            const executionContext: ExecutionContext = {
                workflowId: workflow.id,
                executionId: execution._id.toString(),
                data: {
                    ...node.data,
                    config: node.data.config || {}
                },
                previousNodeOutput: previousOutput
            };

            let result: ExecutionResult;

            switch (node.type) {
                case 'slack':
                    result = await slackExecutor.execute(executionContext);
                    break;
                case 'conditional':
                    result = await conditionExecutor.execute(executionContext);
                    break;
                case 'filter':
                    result = await filterExecutor.execute(executionContext);
                    break;
                case 'googleSheets':
                    result = await googleSheetsExecutor.execute(executionContext);
                    break;
                case 'email':
                    result = await emailExecutor.execute(executionContext);
                    break;
                case 'whatsapp':
                    result = await whatsappExecutor.execute(executionContext);
                    break;
                case 'http':
                    result = await httpExecutor.execute(executionContext);
                    break;
                case 'delay':
                    result = await delayExecutor.execute(executionContext);
                    break;
                case 'database':
                    result = await databaseExecutor.execute(executionContext);
                    break;
                case 'javascript':
                case 'code':
                    result = await javascriptExecutor.execute(executionContext);
                    break;
                case 'set':
                    result = await setExecutor.execute(executionContext);
                    break;
                case 'discord':
                    result = await discordExecutor.execute(executionContext);
                    break;
                case 'webhook':
                    result = { success: true, data: payload };
                    break;
                default:
                    result = { success: true, data: previousOutput };
                    break;
            }

            const logEntry = {
                nodeId: node.id,
                timestamp: new Date(),
                message: result.success ? 'Node executed successfully' : 'Node execution failed',
                data: result.data,
                level: result.success ? 'info' : 'error',
                type: node.type
            };

            executionLogs.push({
                ...logEntry,
                success: result.success,
                result: result,
                outputHandle: result.outputHandle
            });

            execution.logs.push(logEntry as any);

            if (!result.success) {
                console.error(`❌ Node ${node.id} failed:`, result.error);
                throw new Error(result.error);
            }

            results[node.id] = result;
            previousOutput = result.data;

            // Handle branching logic
            if (result.outputHandle) {
                const currentNodeId = node.id;
                const outputHandle = result.outputHandle;
                const outgoingEdges = edges.filter(e => e.source === currentNodeId);

                outgoingEdges.forEach(edge => {
                    console.log(`🔍 Checking edge ${edge.id}: sourceHandle=${edge.sourceHandle} vs outputHandle=${outputHandle}`);
                    if (edge.sourceHandle && edge.sourceHandle !== outputHandle) {
                        console.log(`🚫 Skipping target node ${edge.target} because handle mismatch`);
                        skippedNodes.add(edge.target);
                    } else {
                        console.log(`✅ Proceeding to target node ${edge.target}`);
                    }
                });
            }
        }

        // Mark execution as completed
        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.outputData = previousOutput;
        execution.result = results;

        await execution.save();

        const executionResult: any = {
            status: 'success',
            workflowId: workflow.id,
            executedAt: new Date().toISOString(),
            executedNodes: sortedNodes.length,
            results,
            logs: executionLogs
        };

        // Include webhook-specific data if context available
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

    } catch (error: any) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.completedAt = new Date();
        await execution.save();

        console.error('❌ Workflow execution failed:', error);
        return {
            status: 'failed',
            workflowId: workflow.id,
            error: error.message,
            logs: executionLogs
        };
    }
}

/**
 * Topological sort helper
 */
function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegree = new Map(nodes.map((n) => [n.id, 0]));
    const adjacencyList = new Map(nodes.map((n) => [n.id, [] as string[]]));

    for (const edge of edges) {
        adjacencyList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
        if (degree === 0) queue.push(nodeId);
    }

    const sorted: WorkflowNode[] = [];
    while (queue.length > 0) {
        const nodeId = queue.shift()!;
        const node = nodeMap.get(nodeId);
        if (node) sorted.push(node);

        for (const neighbor of adjacencyList.get(nodeId) || []) {
            const newDegree = (inDegree.get(neighbor) || 0) - 1;
            inDegree.set(neighbor, newDegree);
            if (newDegree === 0) queue.push(neighbor);
        }
    }

    return sorted;
}
