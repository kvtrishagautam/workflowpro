import { WorkflowNode } from '../types/node';

class NodeRegistry {
    private nodes: Map<string, WorkflowNode> = new Map();

    register(node: WorkflowNode) {
        this.nodes.set(node.type, node);
        console.log(`Registered node type: ${node.type}`);
    }

    get(type: string): WorkflowNode | undefined {
        return this.nodes.get(type);
    }

    getAll(): WorkflowNode[] {
        return Array.from(this.nodes.values());
    }
}

export const nodeRegistry = new NodeRegistry();
