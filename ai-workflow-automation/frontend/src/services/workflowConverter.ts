import { Workflow as FrontendWorkflow } from '../types';
import { Workflow as BackendWorkflow, WorkflowNodeData } from '../types/workflow';

/**
 * Map frontend node types (camelCase) to backend node types (SCREAMING_SNAKE_CASE)
 */
function mapNodeTypeToBackend(frontendType: string): string {
    const typeMap: Record<string, string> = {
        'webhook': 'webhook',
        'schedule': 'schedule',
        'javascript': 'javascript',
        'conditional': 'conditional',
        'delay': 'delay',
        'http': 'http',
        'slack': 'slack',
        'email': 'email',
        'emailDiscovery': 'EMAIL_DISCOVERY',
        'emailSending': 'EMAIL_SENDING',
        'scheduledEmail': 'SCHEDULED_EMAIL',
        'whatsapp': 'whatsapp',
        'telegram': 'telegram',
        'discord': 'discord',
        'googleSheets': 'googleSheets',
        'airtable': 'airtable',
        'notion': 'notion',
        'openai': 'openai',
        'mysql': 'mysql',
        'postgres': 'postgres',
        'set': 'set',
        'filter': 'filter',
        'merge': 'merge',
        'splitBatches': 'splitBatches',
    };

    return typeMap[frontendType] || frontendType;
}

/**
 * Convert frontend Workflow format to backend format
 */
export function toBackendWorkflow(frontendWorkflow: FrontendWorkflow): BackendWorkflow {
    const workflowId = frontendWorkflow.id || 'workflow_' + Date.now().toString();

    const nodes = frontendWorkflow.nodes.map(function (node) {
        const nodeData: any = {
            id: node.id,
            type: mapNodeTypeToBackend(node.type),
            config: node.data?.config || {}
        };
        return nodeData;
    });

    const edges = frontendWorkflow.edges.map(function (edge) {
        return {
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle
        };
    });

    return {
        id: workflowId,
        nodes: nodes,
        edges: edges
    };
}

/**
 * Convert backend Workflow format to frontend format
 */
export function toFrontendWorkflow(
    backendWorkflow: BackendWorkflow,
    existingWorkflow?: FrontendWorkflow
): FrontendWorkflow {
    const workflowId = backendWorkflow.id || 'workflow_' + Date.now().toString();
    const workflowName = existingWorkflow?.name || 'Imported Workflow';
    const workflowDesc = existingWorkflow?.description || '';
    const createdTime = existingWorkflow?.createdAt || new Date().toISOString();
    const updatedTime = new Date().toISOString();

    const nodes = backendWorkflow.nodes.map(function (node) {
        return {
            id: node.id,
            type: node.type,
            data: {
                label: node.type + ' Node',
                config: node.config
            },
            position: { x: 100, y: 100 }
        };
    });

    const edges = backendWorkflow.edges.map(function (edge, index) {
        return {
            id: 'edge-' + index.toString(),
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle
        };
    });

    return {
        id: workflowId,
        name: workflowName,
        description: workflowDesc,
        nodes: nodes,
        edges: edges,
        createdAt: createdTime,
        updatedAt: updatedTime
    };
}
