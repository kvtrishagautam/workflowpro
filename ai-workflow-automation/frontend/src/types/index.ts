export interface WorkflowProps {
    id: string;
    name: string;
    nodes: NodeProps[];
}

export interface NodeProps {
    id: string;
    type: string;
    data: any;
    position: {
        x: number;
        y: number;
    };
}