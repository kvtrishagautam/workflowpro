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

    // Create execution record
    const execution = new WorkflowExecution({
        workflowId: workflow._id || workflow.id, // Prefer MongoDB _id if available
        status: 'running',
        startedAt: new Date(),
        logs: [],
        inputData: payload
    });

    try {
        await execution.save();
    } catch (saveError) {
        console.error('Failed to create execution record:', saveError);
        // Continue execution even if saving fails initially? 
        // Or fail? Let's log and proceed but we won't be able to update logs later without an ID.
    }

    const results: Record<string, any> = {};
    const executionLogs: any[] = [];

    try {
        // Convert WorkflowNodeData to WorkflowNode (adapting types)
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
            target: e.target
        })) : [];

        // Sort nodes
        const sortedNodes = topologicalSort(nodes, edges);

        // Initial output from trigger
        let previousOutput = payload;

        // Execute nodes
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
                continue;
            }

            console.log(`▶️ Executing node: ${node.type} (${node.id})`);

            const executionContext: ExecutionContext = {
                workflowId: workflow.id,
                executionId: execution._id.toString(), // Use actual DB ID
                data: {
                    ...node.data,
                    config: node.data.config || {}
                },
                previousNodeOutput: previousOutput
            };

            let result: ExecutionResult;

            // Execute based on type
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
                    // Placeholder for other nodes
                    result = { success: true, data: previousOutput };
                    break;
            }

            const logEntry = {
                nodeId: node.id,
                timestamp: new Date(),
                message: result.success ? 'Node executed successfully' : 'Node execution failed',
                data: result.data, // May want to truncate if too large
                level: result.success ? 'info' : 'error',
                type: node.type // Add type for clarity
            };

            executionLogs.push({
                ...logEntry,
                success: result.success, // Keep compatibility with local logs
                result: result,
                outputHandle: result.outputHandle
            });

            // Update DB execution logs
            execution.logs.push(logEntry as any);
            // Optional: await execution.save(); // Save progressively if needed, but might be slow

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

                // Find edges starting from this node
                const outgoingEdges = edges.filter(e => e.source === currentNodeId);

                // Identify nodes to skip (connected to OTHER handles)
                outgoingEdges.forEach(edge => {
                    // If edge has a handle and it DOESN'T match the output handle, skip the target
                    // Note: If edge has NO handle, it's a default path, so usually execute it (unless strict outputHandle logic is desired)
                    // For Conditional Node: handles are 'true' and 'false'.
                    if (edge.sourceHandle && edge.sourceHandle !== outputHandle) {
                        skippedNodes.add(edge.target);
                    }
                });
            }
        }

        // Mark execution as completed
        execution.status = 'completed';
        execution.completedAt = new Date();
        execution.outputData = previousOutput; // Final output
        execution.result = results;

        await execution.save();

        return {
            status: 'success',
            workflowId: workflow.id,
            results,
            logs: executionLogs
        };

    } catch (error: any) {
        // Mark execution as failed
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
