// Database configuration
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
}

// Server configuration
export interface ServerConfig {
    port: number;
    environment: 'development' | 'production' | 'test';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// API Response structure
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    timestamp: string;
}

// User/Auth types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

// Workflow execution types
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

export interface WorkflowExecution {
    id: string;
    workflowId: string;
    userId: string;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    result?: Record<string, any>;
    error?: {
        message: string;
        stack?: string;
    };
}

// Node execution context
export interface NodeExecutionContext {
    nodeId: string;
    nodeType: string;
    input: Record<string, any>;
    config: Record<string, any>;
    previousResults: Record<string, any>;
}

export interface NodeExecutionResult {
    nodeId: string;
    status: 'success' | 'error';
    output: Record<string, any>;
    error?: string;
    executionTime: number;
}
