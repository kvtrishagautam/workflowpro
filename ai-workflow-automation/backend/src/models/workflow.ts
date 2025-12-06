export interface Node {
    id: string;
    type: string;
    data: Record<string, any>;
}

export interface Connection {
    source: string;
    target: string;
}

export interface Workflow {
    id: string;
    name: string;
    nodes: Node[];
    connections: Connection[];
}