import { Workflow, WebhookConfig, WorkflowNodeData, WorkflowEdge } from '../types/workflow';
import { slackExecutor } from '../executors/slack.executor';
import { conditionExecutor } from '../executors/condition.executor';
import { ExecutionContext, ExecutionResult, WorkflowNode } from '../types';

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
                executionId: 'exec-' + Date.now(), // specific execution ID
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
                case 'webhook':
                    result = { success: true, data: payload };
                    break;
                default:
                    // Placeholder for other nodes
                    result = { success: true, data: previousOutput };
                    break;
            }

            executionLogs.push({
                nodeId: node.id,
                type: node.type,
                success: result.success,
                result: result,
                outputHandle: result.outputHandle // Log which handle was taken
            });

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

        return {
            status: 'success',
            workflowId: workflow.id,
            results,
            logs: executionLogs
        };

    } catch (error: any) {
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
