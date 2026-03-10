import { Workflow as FrontendWorkflow } from '../types';
import { Workflow as BackendWorkflow, NodeType } from '../types/workflow';

/**
 * Map frontend node types (camelCase) to backend node types
 */
function mapNodeTypeToBackend(frontendType: string): NodeType {
    const typeMap: Record<string, NodeType> = {
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
        'csvRead': 'csvRead',
        'dataCleaner': 'dataCleaner',
        'analysisEngine': 'analysisEngine',
        'mongoDbStorage': 'mongoDbStorage',
        'dashboardPortal': 'dashboardPortal',
    };

    const result: any = typeMap[frontendType] || frontendType;
    return result;
}

/**
 * Convert frontend Workflow format to backend format
 */
export function toBackendWorkflow(frontendWorkflow: FrontendWorkflow): BackendWorkflow {
    return {
        id: frontendWorkflow.id || `workflow_${Date.now()}`,
        name: frontendWorkflow.name,
        description: frontendWorkflow.description,
        nodes: frontendWorkflow.nodes.map((node) => ({
            id: node.id,
            type: mapNodeTypeToBackend(node.type),
            position: node.position,
            config: node.data.config || {},
            data: {
                label: node.data.label,
                config: node.data.config || {}
            }
        })),
        edges: frontendWorkflow.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle
        })),
    };
}

/**
 * Convert backend Workflow format to frontend format
 */
export function toFrontendWorkflow(
    backendWorkflow: BackendWorkflow,
    existingWorkflow?: FrontendWorkflow
): FrontendWorkflow {
    return {
        id: backendWorkflow.id || `workflow_${Date.now()}`,
        name: backendWorkflow.name || existingWorkflow?.name || 'Imported Workflow',
        description: backendWorkflow.description || existingWorkflow?.description || '',
        nodes: backendWorkflow.nodes.map((node: any) => ({
            id: node.id,
            type: node.type,
            data: {
                label: node.data?.label || `${node.type} Node`,
                config: node.data?.config || node.config || {},
            },
            position: node.position || { x: 100, y: 100 },
        })),
        edges: backendWorkflow.edges.map((edge, index) => ({
            id: edge.id || `edge-${index}`,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle
        })),
        createdAt: existingWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
