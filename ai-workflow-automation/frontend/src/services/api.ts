import axios from 'axios';
import { Workflow } from '../types';

// ─────────────────────────────────────────────────────────────
// Axios-based API client (newbr) — used for auth & workflow CRUD
// ─────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, name: string) =>
        api.post('/auth/register', { email, password, name }),
    getMe: () => api.get('/auth/me'),
};

export const workflowAPI = {
    list: () => api.get('/workflows'),
    get: (id: string) => api.get(`/workflows/${id}`),
    create: (workflow: any) => api.post('/workflows', workflow),
    update: (id: string, workflow: any) => api.put(`/workflows/${id}`, workflow),
    delete: (id: string) => api.delete(`/workflows/${id}`),
    toggle: (id: string) => api.patch(`/workflows/${id}/toggle`),
    execute: (id: string, triggerData?: any) => api.post(`/workflows/${id}/execute`, { triggerData }),
};

export default api;

// ─────────────────────────────────────────────────────────────
// Fetch-based ApiService (origin/merge) — used for node schema,
// email scheduling, job management, and health checks
// ─────────────────────────────────────────────────────────────

const API_BASE_URL = 'http://localhost:4000';

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
     * Send scheduled email immediately (Send Now)
     */
    async sendNow(jobId: string): Promise<{ message: string; successCount?: number; failureCount?: number }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/scheduled-jobs/${jobId}/send-now`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || 'Failed to send email');
            }

            return await response.json();
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Cancel a scheduled job
     */
    async cancelJob(jobId: string): Promise<{ message: string }> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/scheduled-jobs/${jobId}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(errorData.error || 'Failed to cancel job');
            }

            return await response.json();
        } catch (error) {
            console.error('Error cancelling job:', error);
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
            'googleSheets': 'GOOGLE_SHEETS',
            'webhook': 'WEBHOOK',
            'javascript': 'JAVASCRIPT',
            'slack': 'SLACK',
            'http': 'HTTP',
            'conditional': 'CONDITIONAL',
            'delay': 'DELAY',
            'csvRead': 'csvRead',
            'dataCleaner': 'dataCleaner',
            'analysisEngine': 'analysisEngine',
            'mongoDbStorage': 'mongoDbStorage',
            'dashboardPortal': 'dashboardPortal',
        };
        return typeMap[frontendType] || frontendType.toUpperCase();
    }
}

export const apiService = new ApiService();
