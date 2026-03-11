import axios from 'axios';
import { Workflow } from '../types';

<<<<<<< HEAD
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

=======
>>>>>>> 3dd29fab9d912a277f3822661dcb87d347a69f05
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
                nodes: workflow.nodes.map(node => {
                    const rawConfig = { ...(node.data.config || {}) };

                    // For email-sending nodes, pack flat SMTP credential fields
                    // into the nested smtpConfig object the backend expects.
                    // The Credentials tab stores: smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom
                    if (node.type === 'emailSending') {
                        const hasSmtpCreds = rawConfig.smtpHost || rawConfig.smtpUser || rawConfig.smtpPassword;
                        if (hasSmtpCreds) {
                            // Auto-infer host from email domain if user didn't provide one
                            let smtpHost = rawConfig.smtpHost || '';
                            if (!smtpHost && rawConfig.smtpUser && rawConfig.smtpUser.includes('@')) {
                                const domain = rawConfig.smtpUser.split('@')[1];
                                if (domain === 'gmail.com') smtpHost = 'smtp.gmail.com';
                                else if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) smtpHost = 'smtp-mail.outlook.com';
                                else if (['yahoo.com', 'ymail.com'].includes(domain)) smtpHost = 'smtp.mail.yahoo.com';
                                else smtpHost = `smtp.${domain}`;
                                console.log(`[API] Auto-inferred SMTP host: ${smtpHost}`);
                            }
                            rawConfig.smtpConfig = {
                                host: smtpHost,
                                port: Number(rawConfig.smtpPort) || 587,
                                user: rawConfig.smtpUser || '',
                                pass: rawConfig.smtpPassword || '',
                                from: rawConfig.smtpFrom || undefined,
                            };
                            console.log('[API] Packed smtpConfig for emailSending node:', {
                                host: rawConfig.smtpConfig.host,
                                port: rawConfig.smtpConfig.port,
                                user: rawConfig.smtpConfig.user,
                                hasPass: !!rawConfig.smtpConfig.pass,
                            });
                        } else {
                            console.warn('[API] emailSending node has NO SMTP credentials in config. Keys present:', Object.keys(rawConfig));
                        }
                        // Always remove flat keys — backend uses the nested smtpConfig
                        delete rawConfig.smtpHost;
                        delete rawConfig.smtpPort;
                        delete rawConfig.smtpUser;
                        delete rawConfig.smtpPassword;
                        delete rawConfig.smtpFrom;
                    }

                    // For scheduled-email nodes, ensure recipients is an array
                    if (node.type === 'scheduledEmail') {
                        if (rawConfig.recipients && typeof rawConfig.recipients === 'string') {
                            rawConfig.recipients = rawConfig.recipients
                                .split(',')
                                .map((r: string) => r.trim())
                                .filter(Boolean);
                        }
                        // Convert maxExecutions to number if present
                        if (rawConfig.maxExecutions) {
                            rawConfig.maxExecutions = Number(rawConfig.maxExecutions);
                        }
                    }

                    return {
                        id: node.id,
                        type: this.mapNodeTypeToBackend(node.type),
                        input: rawConfig,
                    };
                }),
                edges: workflow.edges
            };

            console.log('[API] Outgoing workflow payload:', JSON.stringify(backendWorkflow, null, 2));

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
