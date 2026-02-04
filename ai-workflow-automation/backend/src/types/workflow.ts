/**
 * Webhook Node Configuration Types (Backend)
 */

// HTTP Methods supported by webhook
export type WebhookHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

// Authentication types
export type WebhookAuthType = 'none' | 'basicAuth' | 'headerAuth';

// Response mode options
export type WebhookResponseMode = 'immediately' | 'lastNode' | 'responseNode';

// Response data options
export type WebhookResponseData = 'allEntries' | 'firstEntryJson' | 'firstEntryBinary' | 'noResponseBody';

// Common HTTP Response Codes
export type WebhookResponseCode = 200 | 201 | 202 | 204 | 301 | 302 | 400 | 401 | 403 | 404 | 500;

// Basic Auth credentials
export interface BasicAuthCredentials {
    username: string;
    password: string;
}

// Header Auth credentials
export interface HeaderAuthCredentials {
    headerName: string;
    headerValue: string;
}

// Webhook node options
export interface WebhookOptions {
    allowedOrigins?: string;
    binaryPropertyName?: string;
    ignoreBots?: boolean;
    ipWhitelist?: string;
    noResponseBody?: boolean;
    rawBody?: boolean;
    responseContentType?: string;
    customResponseData?: string;
    responseHeaders?: Record<string, string>;
    propertyName?: string;
}

// Webhook configuration
export interface WebhookConfig {
    path: string;
    httpMethod: WebhookHttpMethod;
    authentication: WebhookAuthType;
    basicAuthCredentials?: BasicAuthCredentials;
    headerAuthCredentials?: HeaderAuthCredentials;
    responseMode: WebhookResponseMode;
    responseCode: WebhookResponseCode;
    responseData?: WebhookResponseData;
    options: WebhookOptions;
}

export interface WorkflowNodeData {
    id: string;
    type: string;
    data: {
        label: string;
        config: Record<string, any>;
        [key: string]: any;
    };
    position: { x: number; y: number };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    nodes: WorkflowNodeData[];
    edges: WorkflowEdge[];
    isActive: boolean;
    webhookUrl: string;
    createdAt?: Date;
    updatedAt?: Date;
}
