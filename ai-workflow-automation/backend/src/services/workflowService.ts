import { Workflow } from '../types/workflow';

export class WorkflowService {
    // In future iterations, this will handle:
    // - Workflow validation
    // - Node dependency resolution
    // - Workflow versioning
    // - Workflow state management

    static validateWorkflow(workflow: Workflow): boolean {
        if (!workflow.id) {
            throw new Error('Workflow must have an ID');
        }

        if (!workflow.nodes || workflow.nodes.length === 0) {
            throw new Error('Workflow must have at least one node');
        }

        // Check for webhook node
        const hasWebhook = workflow.nodes.some(node => node.type === 'webhook');
        if (!hasWebhook) {
            console.warn('⚠️ Workflow has no webhook trigger node');
        }

        return true;
    }

    static getWorkflowStartNode(workflow: Workflow) {
        // Find webhook node or first node
        return workflow.nodes.find(node => node.type === 'webhook') || workflow.nodes[0];
    }
}
