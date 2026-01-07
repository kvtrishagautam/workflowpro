export interface NodeData {
    label: string;
    config: Record<string, any>;
}

export interface WorkflowNode {
    id: string;
    type: 'webhook' | 'javascript' | 'slack' | 'http' | 'conditional' | 'delay';
    data: NodeData;
    position: { x: number; y: number };
}

export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
}

export interface ExecutionContext {
    workflowId: string;
    executionId: string;
    data: any;
    previousNodeOutput?: any;
}

export interface ExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
    nextNodes?: string[];
}

export interface LogEntry {
    nodeId: string;
    timestamp: Date;
    message: string;
    data?: any;
    level: 'info' | 'warn' | 'error';
}
