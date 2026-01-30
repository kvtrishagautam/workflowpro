export type RunStatus = 'running' | 'waiting' | 'success' | 'failed';

export interface NodeRunLog {
    nodeId: string;
    nodeType: string;
    input: any;
    output?: any;
    status: 'success' | 'failed';
    error?: string;
    timestamp: number;
}

export interface WorkflowRun {
    id: string;
    workflowId?: string;
    status: RunStatus;
    startedAt: number;
    finishedAt?: number;
    waitingUntil?: number;
    logs: NodeRunLog[];
}
