export interface NodePosition {
    x: number;
    y: number;
}

export interface NodeData {
    label: string;
    config?: Record<string, any>;
    [key: string]: any;
}

export interface NodeProps {
    id: string;
    type: 'webhook' | 'javascript' | 'slack' | 'http' | 'conditional' | 'delay';
    data: NodeData;
    position: NodePosition;
}

export interface Edge {
    source: string;
    target: string;
    id: string;
}

export interface WorkflowProps {
    id: string;
    name: string;
    description?: string;
    nodes: NodeProps[];
    edges: Edge[];
    createdAt?: string;
    updatedAt?: string;
}

// Backwards-compatible alias used across the repo
export type Workflow = WorkflowProps;

// Node type definitions
export const NODE_TYPES = {
    WEBHOOK: 'webhook',
    JAVASCRIPT: 'javascript',
    SLACK: 'slack',
    HTTP: 'http',
    CONDITIONAL: 'conditional',
    DELAY: 'delay',
} as const;

// Node configuration interface
export interface NodeConfig {
    type: typeof NODE_TYPES[keyof typeof NODE_TYPES];
    label: string;
    icon: string;
    color: string;
    description: string;
}