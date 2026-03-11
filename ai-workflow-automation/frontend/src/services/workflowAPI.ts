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

    static async handleResponse(response: Response) {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Session expired. Redirecting to login...');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Save a workflow to the backend (creates new)
     */
    static async saveWorkflow(workflow: any): Promise<SaveWorkflowResponse> {
        const response = await fetch(`${BACKEND_URL}/workflows`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(workflow),
        });

        return this.handleResponse(response);
    }

    /**
     * Update an existing workflow (replaces nodes/edges/config)
     */
    static async updateWorkflow(id: string, workflow: any): Promise<SaveWorkflowResponse> {
        const response = await fetch(`${BACKEND_URL}/workflows/${id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(workflow),
        });

        const data = await this.handleResponse(response);
        // Normalise response shape to match SaveWorkflowResponse
        return {
            status: 'saved',
            workflowId: data.id || id,
            webhooks: data.webhooks,
        };
    }

    /**
     * Get all workflows from the backend
     */
    static async getAllWorkflows(): Promise<any[]> {
        const response = await fetch(`${BACKEND_URL}/workflows`, {
            headers: this.getAuthHeaders()
        });

        const data = await this.handleResponse(response);
        return data.workflows || [];
    }

    /**
     * Get workflow by ID
     */
    static async getWorkflowById(id: string): Promise<any> {
        const response = await fetch(`${BACKEND_URL}/workflows/${id}`, {
            headers: this.getAuthHeaders()
        });

        return this.handleResponse(response);
    }

    /**
     * Delete a workflow by ID
     */
    static async deleteWorkflow(id: string): Promise<void> {
        const response = await fetch(`${BACKEND_URL}/workflows/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });

        await this.handleResponse(response);
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
