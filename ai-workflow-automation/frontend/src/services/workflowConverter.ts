import { Workflow as FrontendWorkflow } from '../types';
import { Workflow as BackendWorkflow, WorkflowNodeData } from '../types/workflow';

/**
 * Convert frontend Workflow format to backend format
 */
export function toBackendWorkflow(frontendWorkflow: FrontendWorkflow): BackendWorkflow {
    return {
        id: frontendWorkflow.id || `workflow_${Date.now()}`,
        nodes: frontendWorkflow.nodes.map((node): WorkflowNodeData => ({
            id: node.id,
            type: node.type,
            config: node.data?.config || {},
        })),
        edges: frontendWorkflow.edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
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
        name: existingWorkflow?.name || 'Imported Workflow',
        description: existingWorkflow?.description || '',
        nodes: backendWorkflow.nodes.map((node) => ({
            id: node.id,
            type: node.type,
            data: {
                label: `${node.type} Node`,
                config: node.config,
            },
            position: { x: 100, y: 100 }, // Default position, can be improved
        })),
        edges: backendWorkflow.edges.map((edge, index) => ({
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
        })),
        createdAt: existingWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
