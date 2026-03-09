export interface NodeInput {
    [key: string]: any;
}

export interface NodeOutput {
    [key: string]: any;
}

export interface NodeExecutionResult {
    status: 'success' | 'error';
    data?: NodeOutput;
    error?: string;
    metadata?: any;
}

export interface WorkflowNode {
    id: string;
    type: string;
    name: string;
    description: string;
    inputSchema: any;
    outputSchema: any;
    execute: (input: NodeInput) => Promise<NodeExecutionResult>;
}
