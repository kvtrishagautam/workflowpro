const BACKEND_URL = 'http://localhost:4000/api';

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
    static getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    /**
     * Save a workflow to the backend
     */
    static async saveWorkflow(workflow: any): Promise<SaveWorkflowResponse> {
        const response = await fetch(`${BACKEND_URL}/workflows`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(workflow),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save workflow');
        }

        return response.json();
    }

    /**
     * Get all workflows from the backend
     */
    static async getAllWorkflows(): Promise<any[]> {
        const response = await fetch(`${BACKEND_URL}/workflows`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch workflows');
        }

        const data = await response.json();
        return data.workflows || [];
    }

    /**
     * Get workflow by ID
     */
    static async getWorkflowById(id: string): Promise<any> {
        const response = await fetch(`${BACKEND_URL}/workflows/${id}`, {
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch workflow');
        }

        return response.json();
    }

    /**
     * Delete a workflow by ID
     */
    static async deleteWorkflow(id: string): Promise<void> {
        const response = await fetch(`${BACKEND_URL}/workflows/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete workflow');
        }
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
