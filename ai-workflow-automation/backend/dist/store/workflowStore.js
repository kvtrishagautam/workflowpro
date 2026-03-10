"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveWorkflow = saveWorkflow;
exports.getWorkflow = getWorkflow;
exports.findWorkflowByWebhook = findWorkflowByWebhook;
exports.extractRouteParams = extractRouteParams;
exports.getAllWorkflows = getAllWorkflows;
const workflows = new Map();
function saveWorkflow(workflow) {
    workflows.set(workflow.id, workflow);
    console.log(`Workflow ${workflow.id} saved successfully`);
}
function getWorkflow(id) {
    return workflows.get(id);
}
function findWorkflowByWebhook(path, method) {
    // Normalize path: ensure it starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return [...workflows.values()].find((workflow) => workflow.nodes.some((node) => {
        if (node.type !== 'webhook')
            return false;
        // Support both React Flow structure (node.data.config) and direct structure (node.config)
        const config = node.data?.config || node.config || {};
        // Support both old format (method) and new format (httpMethod)
        const nodeMethod = config.httpMethod || config.method || 'POST';
        let nodePath = config.path || '/';
        // Normalize nodePath: ensure it starts with /
        nodePath = nodePath.startsWith('/') ? nodePath : `/${nodePath}`;
        // Check for exact path match
        if (nodePath === normalizedPath && nodeMethod === method) {
            return true;
        }
        // Check for route parameter match (e.g., /:id matches /123)
        if (nodePath.includes(':')) {
            const pathParts = nodePath.split('/');
            const requestParts = normalizedPath.split('/');
            if (pathParts.length !== requestParts.length)
                return false;
            const matches = pathParts.every((part, i) => {
                if (part.startsWith(':'))
                    return true; // Parameter matches anything
                return part === requestParts[i];
            });
            return matches && nodeMethod === method;
        }
        return false;
    }));
}
// Extract route parameters from a request path based on the webhook path template
function extractRouteParams(webhookPath, requestPath) {
    const params = {};
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
function getAllWorkflows() {
    return [...workflows.values()];
}
