import { ExecutionContext, ExecutionResult, WorkflowNode, WorkflowEdge } from '../types';
import { slackExecutor } from '../executors/slack.executor';
import { WorkflowExecution } from '../models/WorkflowExecution';

/**
 * Workflow Execution Service
 * Orchestrates the execution of workflow nodes in the correct order
 */
export class WorkflowExecutionService {
    /**
     * Execute a complete workflow
     * @param workflowId - ID of the workflow being executed
     * @param nodes - Array of workflow nodes
     * @param edges - Array of workflow edges (connections)
     * @param triggerData - Initial data that triggered the workflow
     * @returns Execution results for all nodes
     */
    async executeWorkflow(
        workflowId: string,
        nodes: WorkflowNode[],
        edges: WorkflowEdge[],
        triggerData: any = {}
    ): Promise<any> {
        // Create execution record
        const execution = new WorkflowExecution({
            workflowId,
            status: 'running',
            startedAt: new Date(),
            logs: [],
        });
        await execution.save();

        try {
            // Sort nodes in execution order (topological sort)
            const sortedNodes = this.topologicalSort(nodes, edges);

            const results: Record<string, any> = {};
            let previousOutput = triggerData;

            // Execute nodes in order
            for (const node of sortedNodes) {
                const context: ExecutionContext = {
                    workflowId,
                    executionId: execution._id.toString(),
                    data: {
                        ...node.data,
                        previousNodeOutput: previousOutput,
                    },
                };

                // Execute the node based on its type
                const result = await this.executeNode(node, context);

                // Log the execution
                execution.logs.push({
                    nodeId: node.id,
                    timestamp: new Date(),
                    message: result.success ? 'Node executed successfully' : 'Node execution failed',
                    data: result.data,
                    level: result.success ? 'info' : 'error',
                });

                // Store result
                results[node.id] = result;

                // If node failed and no error handling, stop execution
                if (!result.success) {
                    execution.status = 'failed';
                    execution.error = result.error;
                    execution.completedAt = new Date();
                    await execution.save();
                    throw new Error(result.error);
                }

                // Pass output to next node
                previousOutput = result.data;
            }

            // Mark execution as completed
            execution.status = 'completed';
            execution.result = results;
            execution.completedAt = new Date();
            await execution.save();

            return {
                success: true,
                executionId: execution._id,
                results,
            };
        } catch (error: any) {
            execution.status = 'failed';
            execution.error = error.message;
            execution.completedAt = new Date();
            await execution.save();

            throw error;
        }
    }

    /**
     * Execute a single node based on its type
     * @param node - The workflow node to execute
     * @param context - Execution context
     * @returns Execution result
     */
    private async executeNode(
        node: WorkflowNode,
        context: ExecutionContext
    ): Promise<ExecutionResult> {
        switch (node.type) {
            case 'slack':
                return slackExecutor.execute(context);

            case 'webhook':
                // Webhook nodes are triggers, just pass through the data
                return {
                    success: true,
                    data: context.data,
                };

            case 'javascript':
                // Execute JavaScript code (implement with vm2 for security)
                return this.executeJavaScript(context);

            case 'http':
                // Make HTTP request (implement with axios)
                return this.executeHttp(context);

            case 'conditional':
                // Evaluate condition and determine next nodes
                return this.executeConditional(context);

            case 'delay':
                // Wait for specified duration
                return this.executeDelay(context);

            default:
                return {
                    success: false,
                    error: `Unknown node type: ${node.type}`,
                };
        }
    }

    /**
     * Execute JavaScript node (placeholder)
     */
    private async executeJavaScript(context: ExecutionContext): Promise<ExecutionResult> {
        // TODO: Implement with vm2 for secure code execution
        return {
            success: true,
            data: { message: 'JavaScript execution not yet implemented' },
        };
    }

    /**
     * Execute HTTP node (placeholder)
     */
    private async executeHttp(context: ExecutionContext): Promise<ExecutionResult> {
        // TODO: Implement with axios
        return {
            success: true,
            data: { message: 'HTTP execution not yet implemented' },
        };
    }

    /**
     * Execute conditional node (placeholder)
     */
    private async executeConditional(context: ExecutionContext): Promise<ExecutionResult> {
        // TODO: Implement condition evaluation
        return {
            success: true,
            data: { message: 'Conditional execution not yet implemented' },
        };
    }

    /**
     * Execute delay node (placeholder)
     */
    private async executeDelay(context: ExecutionContext): Promise<ExecutionResult> {
        const { duration = 1000 } = context.data.config;
        await new Promise((resolve) => setTimeout(resolve, duration));
        return {
            success: true,
            data: { delayed: duration },
        };
    }

    /**
     * Topological sort of nodes based on edges
     * @param nodes - Array of workflow nodes
     * @param edges - Array of workflow edges
     * @returns Sorted array of nodes in execution order
     */
    private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const inDegree = new Map(nodes.map((n) => [n.id, 0]));
        const adjacencyList = new Map(nodes.map((n) => [n.id, [] as string[]]));

        // Build graph
        for (const edge of edges) {
            adjacencyList.get(edge.source)?.push(edge.target);
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        }

        // Find nodes with no incoming edges (start nodes)
        const queue: string[] = [];
        for (const [nodeId, degree] of inDegree.entries()) {
            if (degree === 0) {
                queue.push(nodeId);
            }
        }

        // Sort
        const sorted: WorkflowNode[] = [];
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            const node = nodeMap.get(nodeId);
            if (node) {
                sorted.push(node);
            }

            // Reduce in-degree for neighbors
            for (const neighbor of adjacencyList.get(nodeId) || []) {
                const newDegree = (inDegree.get(neighbor) || 0) - 1;
                inDegree.set(neighbor, newDegree);
                if (newDegree === 0) {
                    queue.push(neighbor);
                }
            }
        }

        // Check for cycles
        if (sorted.length !== nodes.length) {
            throw new Error('Workflow contains a cycle');
        }

        return sorted;
    }
}

// Export singleton instance
export const workflowExecutionService = new WorkflowExecutionService();
