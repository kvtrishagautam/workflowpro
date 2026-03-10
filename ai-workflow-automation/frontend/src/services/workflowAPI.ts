// API service for backend communication

const BACKEND_URL = 'http://localhost:4000';

export interface SaveWorkflowResponse {
    status: string;
    workflowId: string;
    webhooks?: Array<{
        method: string;
        path: string;
    }>;
}

export interface TriggerWebhookResponse {
    status: string;
    workflowId: string;
    result: any;
}

export class WorkflowAPI {
    /**
     * Save a workflow to the backend
     */
    static async saveWorkflow(workflow: any): Promise<SaveWorkflowResponse> {
        const response = await fetch(`${BACKEND_URL}/api/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflow),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || error.error || 'Failed to save workflow');
        }

        const data = await response.json();
        // Normalize response: backend returns { message, workflow } or { status, workflowId, webhooks }
        return {
            status: data.status || 'success',
            workflowId: data.workflowId || data.workflow?.id || '',
            webhooks: data.webhooks || [],
        };
    }

    /**
     * Get all workflows from the backend
     */
    static async getAllWorkflows(): Promise<any[]> {
        const response = await fetch(`${BACKEND_URL}/api/workflows`);

        if (!response.ok) {
            throw new Error('Failed to fetch workflows');
        }

        const data = await response.json();
        return data.workflows || [];
    }

    /**
     * Trigger a webhook manually (for testing)
     */
    static async triggerWebhook(
        path: string,
        method: string,
        payload: any
    ): Promise<TriggerWebhookResponse> {
        const response = await fetch(`${BACKEND_URL}/webhook${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Webhook trigger failed');
        }

        return response.json();
    }

    /**
     * Check backend health status
     */
    static async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${BACKEND_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}
