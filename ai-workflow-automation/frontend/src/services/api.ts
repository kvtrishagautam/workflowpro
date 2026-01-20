import { Workflow } from '../types';

const API_BASE_URL = 'http://localhost:5000';

export interface NodeSchema {
    id: string;
    type: string;
    name: string;
    description: string;
    inputSchema: any;
    outputSchema: any;
}

export interface WorkflowExecutionResult {
    status: 'success' | 'error';
    results?: Array<{
        nodeId: string;
        nodeType: string;
        result: {
            status: 'success' | 'error';
            data?: any;
            error?: string;
        };
    }>;
    error?: string;
}

class ApiService {
    /**
     * Fetch all available nodes from the backend
     */
    async fetchNodes(): Promise<{ nodes: NodeSchema[] }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/nodes`);
            if (!response.ok) {
                throw new Error(`Failed to fetch nodes: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching nodes:', error);
            throw error;
        }
    }

    /**
     * Execute a workflow on the backend
     */
    async executeWorkflow(workflow: Workflow): Promise<WorkflowExecutionResult> {
        try {
            // Transform frontend workflow format to backend format
            const backendWorkflow = {
                nodes: workflow.nodes.map(node => ({
                    id: node.id,
                    type: this.mapNodeTypeToBackend(node.type),
                    input: node.data.config || {}
                })),
                edges: workflow.edges
            };

            const response = await fetch(`${API_BASE_URL}/api/workflows/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(backendWorkflow),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || `Workflow execution failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing workflow:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                status: 'error',
                error: errorMessage
            };
        }
    }

    /**
     * Check backend health
     */
    async healthCheck(): Promise<{ status: string; message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (!response.ok) {
                throw new Error('Backend is not responding');
            }
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    }

    /**
     * Map frontend node types to backend node types
     */
    mapNodeTypeToBackend(frontendType: string): string {
        const typeMap: Record<string, string> = {
            'emailDiscovery': 'EMAIL_DISCOVERY',
            'emailSending': 'EMAIL_SENDING',
            'scheduledEmail': 'SCHEDULED_EMAIL',
            'webhook': 'WEBHOOK',
            'javascript': 'JAVASCRIPT',
            'slack': 'SLACK',
            'http': 'HTTP',
            'conditional': 'CONDITIONAL',
            'delay': 'DELAY',
        };
        return typeMap[frontendType] || frontendType.toUpperCase();
    }
}

export const apiService = new ApiService();
