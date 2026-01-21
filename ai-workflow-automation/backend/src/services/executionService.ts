import { Workflow, WebhookConfig } from '../types/workflow';

// Webhook execution context - contains request data and webhook configuration
export interface WebhookExecutionContext {
    webhookConfig: Partial<WebhookConfig>;
    request: {
        body: any;
        query: Record<string, string>;
        params: Record<string, string>;
        headers: Record<string, string>;
        method: string;
        path: string;
        ip: string;
    };
}

export async function executeWorkflow(
    workflow: Workflow,
    payload: any,
    context?: WebhookExecutionContext
): Promise<any> {
    console.log(
        `🚀 Executing workflow ${workflow.id} with payload:`,
        JSON.stringify(payload, null, 2)
    );

    if (context) {
        console.log(`📋 Webhook context:`, {
            method: context.request.method,
            path: context.request.path,
            ip: context.request.ip,
            authentication: context.webhookConfig.authentication,
            responseMode: context.webhookConfig.responseMode,
        });
    }

    const webhookNode = workflow.nodes.find(node => node.type === 'webhook');
    if (webhookNode) {
        const method = webhookNode.config.httpMethod || webhookNode.config.method || 'POST';
        console.log(`✅ Webhook triggered: ${webhookNode.config.path} [${method}]`);
    }

    // Log all nodes in the workflow
    console.log(`📋 Workflow has ${workflow.nodes.length} nodes:`);
    workflow.nodes.forEach((node, index) => {
        console.log(`   ${index + 1}. ${node.type} (${node.id})`);
    });

    // Build the execution result with webhook data included
    const executionResult: any = {
        status: 'success',
        workflowId: workflow.id,
        executedAt: new Date().toISOString(),
        payload,
    };

    // If we have context, include webhook-specific data
    if (context) {
        executionResult.webhookData = {
            method: context.request.method,
            path: context.request.path,
            query: context.request.query,
            headers: {
                'content-type': context.request.headers['content-type'],
                'user-agent': context.request.headers['user-agent'],
            },
            body: context.request.body,
        };
    }

    // TODO: In next iteration, integrate with shared execution engine
    // For now, return success status with all relevant data
    return executionResult;
}
