import { Workflow as IWorkflow } from '../types/workflow';
import { Workflow } from '../models/Workflow';
import mongoose from 'mongoose';

/**
 * Save a workflow to the database
 */
export async function saveWorkflow(workflowData: IWorkflow): Promise<IWorkflow> {
    try {
        const existing = await Workflow.findOne({ id: workflowData.id });

        if (existing) {
            // Update existing workflow
            Object.assign(existing, workflowData);
            await existing.save();
            console.log(`Workflow ${workflowData.id} updated successfully`);
            return existing.toObject();
        } else {
            // Create new workflow

            // Remove any incoming _id fields (top-level and nested) to avoid ObjectId cast issues
            function removeIdFields(obj: any) {
                if (!obj || typeof obj !== 'object') return;
                if (Array.isArray(obj)) {
                    obj.forEach(removeIdFields);
                    return;
                }
                if (obj._id) delete obj._id;
                Object.values(obj).forEach((v) => removeIdFields(v));
            }

            removeIdFields(workflowData as any);

            // Ensure basic top-level fields
            if (!workflowData.name) workflowData.name = workflowData.id || 'Untitled Workflow';
            if (!Array.isArray(workflowData.nodes)) workflowData.nodes = [];
            if (!Array.isArray(workflowData.edges)) workflowData.edges = [];

            // Ensure nodes have the correct structure for Mongoose
            workflowData.nodes = workflowData.nodes.map((node: any, idx: number) => {
                const nodeId = node.id || `node-${Date.now()}-${idx}`;
                const nodeData = node.data || {};

                // Default label
                const label = nodeData.label || node.type || `Node ${idx + 1}`;

                // Default position
                const position = node.position || { x: 100 + idx * 200, y: 100 };
                if (typeof position.x !== 'number') position.x = Number(position.x) || 100 + idx * 200;
                if (typeof position.y !== 'number') position.y = Number(position.y) || 100;

                return {
                    ...node,
                    id: nodeId,
                    data: {
                        ...nodeData,
                        label,
                        config: nodeData.config || {}
                    },
                    position,
                };
            });

            // Ensure edges have ids and minimal fields
            workflowData.edges = workflowData.edges.map((edge: any, idx: number) => {
                const edgeId = edge.id || `edge-${Date.now()}-${idx}`;
                return {
                    ...edge,
                    id: edgeId,
                    source: edge.source,
                    target: edge.target,
                };
            });

            // Build a sanitized document for Mongoose (omit incoming `id`/_id fields)
            const doc: any = {
                userId: (workflowData as any).userId || new mongoose.Types.ObjectId(),
                id: (workflowData as any).id || `wf_${Date.now()}`,
                name: workflowData.name,
                description: workflowData.description || '',
                nodes: workflowData.nodes,
                edges: workflowData.edges,
                isActive: typeof workflowData.isActive === 'boolean' ? workflowData.isActive : true,
            };

            // Only set webhookUrl if provided; otherwise schema default will apply
            if (workflowData.webhookUrl) doc.webhookUrl = workflowData.webhookUrl;

            const newWorkflow = new Workflow(doc);
            await newWorkflow.save();
            console.log(`Workflow ${workflowData.id || newWorkflow._id} created successfully`);
            return newWorkflow.toObject();
        }
    } catch (error) {
        console.error(`Error saving workflow ${workflowData.id}:`, error);
        throw error;
    }
}

/**
 * Get a workflow by ID
 */
export async function getWorkflow(id: string): Promise<IWorkflow | undefined> {
    try {
        const workflow = await Workflow.findOne({ id });
        return workflow ? workflow.toObject() : undefined;
    } catch (error) {
        console.error(`Error fetching workflow ${id}:`, error);
        return undefined;
    }
}

/**
 * Find a workflow by its webhook path and method
 */
export async function findWorkflowByWebhook(
    path: string,
    method: string
): Promise<IWorkflow | undefined> {
    try {
        // Find workflows that have a webhook node
        const workflows = await Workflow.find({
            'nodes.type': 'webhook',
            isActive: true
        });

        return workflows.find((workflow) =>
            workflow.nodes.some((node) => {
                if (node.type !== 'webhook') return false;

                // Support both old format (method) and new format (httpMethod)
                const config = node.data?.config || (node as any).config || {};
                const nodeMethod = config.httpMethod || config.method || 'POST';
                const nodePath = config.path || '/';

                // Check for exact path match
                if (nodePath === path && nodeMethod === method) {
                    return true;
                }

                // Check for route parameter match (e.g., /:id matches /123)
                if (nodePath.includes(':')) {
                    const pathParts = nodePath.split('/');
                    const requestParts = path.split('/');

                    if (pathParts.length !== requestParts.length) return false;

                    const matches = pathParts.every((part: string, i: number) => {
                        if (part.startsWith(':')) return true; // Parameter matches anything
                        return part === requestParts[i];
                    });

                    return matches && nodeMethod === method;
                }

                return false;
            })
        )?.toObject();
    } catch (error) {
        console.error('Error finding workflow by webhook:', error);
        return undefined;
    }
}

/**
 * Extract route parameters from a request path based on the webhook path template
 */
export function extractRouteParams(
    webhookPath: string,
    requestPath: string
): Record<string, string> {
    const params: Record<string, string> = {};
    const webhookParts = webhookPath.split('/');
    const requestParts = requestPath.split('/');

    webhookParts.forEach((part, i) => {
        if (part.startsWith(':')) {
            const paramName = part.slice(1);
            params[paramName] = requestParts[i];
        }
    });

    return params;
}

/**
 * Get all workflows
 */
/**
 * Get all workflows (admin only or internal use)
 */
export async function getAllWorkflows(): Promise<IWorkflow[]> {
    try {
        const workflows = await Workflow.find().sort({ updatedAt: -1 });
        return workflows.map(w => w.toObject());
    } catch (error) {
        console.error('Error fetching all workflows:', error);
        return [];
    }
}

/**
 * Get workflows for a specific user
 */
export async function getWorkflowsByUser(userId: string): Promise<IWorkflow[]> {
    try {
        const workflows = await Workflow.find({ userId }).sort({ updatedAt: -1 });
        return workflows.map(w => w.toObject());
    } catch (error) {
        console.error(`Error fetching workflows for user ${userId}:`, error);
        return [];
    }
}
