"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayNode = exports.conditionalNode = exports.httpNode = exports.slackNode = exports.javascriptNode = exports.webhookNode = void 0;
// Webhook Node Stub
exports.webhookNode = {
    id: 'webhook',
    type: 'WEBHOOK',
    name: 'Webhook Node',
    description: 'Trigger workflow from external event (Simulated)',
    inputSchema: { type: 'object', properties: { payload: { type: 'object' } } },
    outputSchema: { type: 'object' },
    execute: async (input) => ({
        status: 'success',
        data: input
    })
};
// JavaScript Node Stub
exports.javascriptNode = {
    id: 'javascript',
    type: 'JAVASCRIPT',
    name: 'JavaScript Node',
    description: 'Execute custom code (Simulated)',
    inputSchema: { type: 'object', properties: { code: { type: 'string' } } },
    outputSchema: { type: 'object' },
    execute: async (input) => ({
        status: 'success',
        data: { result: 'Code executed successfully', input }
    })
};
// Slack Node Stub
exports.slackNode = {
    id: 'slack',
    type: 'SLACK',
    name: 'Slack Node',
    description: 'Send message to Slack (Simulated)',
    inputSchema: { type: 'object', properties: { channel: { type: 'string' }, message: { type: 'string' } } },
    outputSchema: { type: 'object' },
    execute: async (input) => ({
        status: 'success',
        data: { status: 'sent', channel: input.channel }
    })
};
// HTTP Node Stub
exports.httpNode = {
    id: 'http',
    type: 'HTTP',
    name: 'HTTP Node',
    description: 'Make HTTP/REST call (Simulated)',
    inputSchema: { type: 'object', properties: { url: { type: 'string' }, method: { type: 'string' } } },
    outputSchema: { type: 'object' },
    execute: async (input) => ({
        status: 'success',
        data: { status: 200, body: {} }
    })
};
// Conditional Node Stub
exports.conditionalNode = {
    id: 'conditional',
    type: 'CONDITIONAL',
    name: 'Conditional Node',
    description: 'Branch based on condition (Simulated)',
    inputSchema: { type: 'object', properties: { condition: { type: 'string' } } },
    outputSchema: { type: 'object' },
    execute: async (input) => ({
        status: 'success',
        data: { match: true }
    })
};
// Delay Node Stub
exports.delayNode = {
    id: 'delay',
    type: 'DELAY',
    name: 'Delay Node',
    description: 'Wait before next step (Simulated)',
    inputSchema: { type: 'object', properties: { seconds: { type: 'number' } } },
    outputSchema: { type: 'object' },
    execute: async (input) => {
        const ms = (input.seconds || 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, ms));
        return {
            status: 'success',
            data: { slept: ms }
        };
    }
};
