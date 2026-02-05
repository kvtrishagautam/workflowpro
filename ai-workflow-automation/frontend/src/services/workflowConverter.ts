import { Workflow as FrontendWorkflow } from '../types';
import { Workflow as BackendWorkflow, WorkflowNodeData } from '../types/workflow';

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
            type: node.type,
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
            sourceHandle: edge.sourceHandle,
        })),
        createdAt: existingWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
