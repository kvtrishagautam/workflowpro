export type Node = {
    id: string;
    type: string;
    data: Record<string, any>;
};

export type Workflow = {
    id: string;
    name: string;
    nodes: Node[];
    connections: Record<string, string[]>;
};

export type Execution = {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: Record<string, any>;
};