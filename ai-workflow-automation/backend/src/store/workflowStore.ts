import { Workflow } from '../types/workflow';

const workflows = new Map<string, Workflow>();

export function saveWorkflow(workflow: Workflow) {
    workflows.set(workflow.id, workflow);
    console.log(`Workflow ${workflow.id} saved successfully`);
}

export function getWorkflow(id: string): Workflow | undefined {
    return workflows.get(id);
}

export function findWorkflowByWebhook(
    path: string,
    method: string
): Workflow | undefined {
    return [...workflows.values()].find((workflow) =>
        workflow.nodes.some((node) => {
            if (node.type !== 'webhook') return false;

            // Support both old format (method) and new format (httpMethod)
            const nodeMethod = node.config.httpMethod || node.config.method || 'POST';
            const nodePath = node.config.path || '/';

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
    );
}

// Extract route parameters from a request path based on the webhook path template
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

export function getAllWorkflows(): Workflow[] {
    return [...workflows.values()];
}
