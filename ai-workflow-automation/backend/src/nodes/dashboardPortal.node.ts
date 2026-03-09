import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';

export const dashboardPortalNode: WorkflowNode = {
    id: 'dashboardPortal',
    name: 'Dashboard Portal',
    type: 'dashboardPortal',
    description: 'A portal node that links to the Standalone Analytics Dashboard.',
    inputSchema: {
        type: 'object',
        properties: {
            data: { type: 'any' }
        }
    },
    outputSchema: {
        type: 'object',
        properties: {
            status: { type: 'string' },
            data: { type: 'any' }
        }
    },
    execute: async (input: any) => {
        console.log(`[Dashboard Portal] Executing node... Data passed through seamlessly.`);
        return {
            status: 'success',
            data: {
                dashboardReady: true,
                dashboardUrl: '/standalone-dashboard.html',
                message: 'Data stored successfully. Open the dashboard to view analytics.',
                category: input?.category || 'Generic',
                datasetId: input?.datasetId || ''
            }
        };
    }
};
