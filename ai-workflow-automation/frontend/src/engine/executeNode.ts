import { NodeProps, Workflow } from '../types';
import { evaluateCondition } from './evaluators';
import { WorkflowRun, NodeRunLog } from '../types/run';
import { updateRun } from '../store/runStore';

export async function executeNode(
    node: NodeProps,
    data: any,
    workflow: Workflow,
    nodeMap: Map<string, NodeProps>,
    run: WorkflowRun
): Promise<void> {
    const log: NodeRunLog = {
        nodeId: node.id,
        nodeType: node.type,
        input: data,
        status: 'success',
        timestamp: Date.now(),
    };

    console.log(`[EXECUTE] ${node.type} node: ${node.id}`, data);

    try {
        let outputData = data;

        // Execute node based on type
        switch (node.type) {
            case 'conditional':
                await executeConditional(node, data, workflow, nodeMap, run);
                return;

            case 'delay':
                return executeDelay(node, data, workflow, nodeMap, run);

            case 'http':
                outputData = await executeHTTP(node, data);
                break;

            case 'javascript':
                outputData = await executeJavaScript(node, data);
                break;

            case 'set':
                outputData = await executeSet(node, data);
                break;

            case 'filter':
                outputData = await executeFilter(node, data);
                break;

            case 'merge':
                outputData = await executeMerge(node, data);
                break;

            case 'splitBatches':
                outputData = await executeSplitBatches(node, data);
                break;

            case 'slack':
                outputData = await executeSlack(node, data);
                break;

            case 'email':
                outputData = await executeEmail(node, data);
                break;

            case 'discord':
                outputData = await executeDiscord(node, data);
                break;

            case 'telegram':
                outputData = await executeTelegram(node, data);
                break;

            case 'whatsapp':
                outputData = await executeWhatsApp(node, data);
                break;

            case 'openai':
                outputData = await executeOpenAI(node, data);
                break;

            case 'googleSheets':
                outputData = await executeGoogleSheets(node, data);
                break;

            case 'webhook':
                // Webhook is a trigger, just pass data through
                outputData = data;
                break;

            default:
                console.warn(`[WARN] Unsupported node type: ${node.type}`);
                outputData = data;
        }

        log.output = outputData;
        await executeNext(node, outputData, workflow, nodeMap, run);
    } catch (err) {
        log.status = 'failed';
        log.error = err instanceof Error ? err.message : String(err);
        throw err;
    } finally {
        run.logs.push(log);
        updateRun(run);
    }
}

async function executeConditional(
    node: NodeProps,
    data: any,
    workflow: Workflow,
    nodeMap: Map<string, NodeProps>,
    run: WorkflowRun
): Promise<void> {
    const rule = node.data.config?.rule;
    if (!rule) {
        console.warn(`[WARN] Conditional node ${node.id} has no rule config`);
        return executeNext(node, data, workflow, nodeMap, run);
    }

    const result = evaluateCondition(rule, data);
    console.log(
        `[CONDITIONAL] Node ${node.id}: rule evaluated to ${result}`
    );

    const edge = workflow.edges.find(
        (e) =>
            e.source === node.id &&
            e.sourceHandle === (result ? 'true' : 'false')
    );

    if (!edge) {
        console.log(
            `[INFO] No edge found for ${result ? 'true' : 'false'} branch`
        );
        return;
    }

    const nextNode = nodeMap.get(edge.target);
    if (nextNode) {
        await executeNode(nextNode, data, workflow, nodeMap, run);
    }
}

async function executeNext(
    node: NodeProps,
    data: any,
    workflow: Workflow,
    nodeMap: Map<string, NodeProps>,
    run: WorkflowRun
): Promise<void> {
    const edge = workflow.edges.find((e) => e.source === node.id);

    if (!edge) {
        console.log(`[INFO] End of workflow at node ${node.id}`);
        return;
    }

    const nextNode = nodeMap.get(edge.target);
    if (nextNode) {
        await executeNode(nextNode, data, workflow, nodeMap, run);
    }
}

async function executeDelay(
    node: NodeProps,
    data: any,
    workflow: Workflow,
    nodeMap: Map<string, NodeProps>,
    run: WorkflowRun
): Promise<void> {
    const config = node.data.config || {};
    const duration = config.duration || 10;
    const unit = config.unit || 'seconds';

    const durationMs =
        unit === 'minutes' ? duration * 60_000 : duration * 1_000;

    const resumeAt = Date.now() + durationMs;

    console.log(
        `[DELAY] Node ${node.id}: waiting ${duration} ${unit} (until ${new Date(resumeAt).toLocaleTimeString()})`
    );

    run.status = 'waiting';
    run.waitingUntil = resumeAt;
    updateRun(run);

    setTimeout(async () => {
        console.log(`[RESUME] Delay complete, resuming from node ${node.id}`);
        run.status = 'running';
        run.waitingUntil = undefined;
        updateRun(run);

        const edge = workflow.edges.find((e) => e.source === node.id);

        if (!edge) {
            console.log(`[INFO] End of workflow at node ${node.id}`);
            run.status = 'success';
            run.finishedAt = Date.now();
            updateRun(run);
            return;
        }

        const nextNode = nodeMap.get(edge.target);
        if (nextNode) {
            await executeNode(nextNode, data, workflow, nodeMap, run);
        }
    }, durationMs);
}
// ============================================
// Node Implementation Functions
// ============================================

/**
 * HTTP Request Node
 * Makes REST API calls with configurable methods, headers, and body
 */
async function executeHTTP(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const method = config.method || 'GET';
    const url = replaceVariables(config.url || '', data);
    const headers = config.headers || {};
    const body = config.body;

    console.log(`[HTTP] Making ${method} request to ${url}`);

    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        if (body && method !== 'GET') {
            options.body = typeof body === 'string'
                ? replaceVariables(body, data)
                : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const responseData = await response.json();

        console.log(`[HTTP] Response status: ${response.status}`);

        return {
            ...data,
            http: {
                statusCode: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseData,
            },
        };
    } catch (error) {
        console.error(`[HTTP] Error:`, error);
        throw new Error(`HTTP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * JavaScript/Code Node
 * Executes custom JavaScript code with access to input data
 */
async function executeJavaScript(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const code = config.code || 'return data;';

    console.log(`[JAVASCRIPT] Executing custom code`);

    try {
        // Create a safe execution context
        const func = new Function('data', 'node', `
            ${code}
        `);

        const result = await func(data, node);

        console.log(`[JAVASCRIPT] Execution complete`);

        return result !== undefined ? result : data;
    } catch (error) {
        console.error(`[JAVASCRIPT] Error:`, error);
        throw new Error(`JavaScript execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Set Node
 * Sets or transforms field values in the data
 */
async function executeSet(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const fields = config.fields || [];

    console.log(`[SET] Setting ${fields.length} field(s)`);

    const result = { ...data };

    for (const field of fields) {
        const { name, value } = field;
        if (name) {
            // Replace variables in the value
            const processedValue = replaceVariables(value, data);
            setNestedProperty(result, name, processedValue);
            console.log(`[SET] Set ${name} = ${processedValue}`);
        }
    }

    return result;
}

/**
 * Filter Node
 * Filters items based on conditions
 */
async function executeFilter(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const conditions = config.conditions || [];
    const mode = config.mode || 'keep'; // 'keep' or 'remove'

    console.log(`[FILTER] Filtering data (mode: ${mode})`);

    // If data has an items array, filter it
    if (data.items && Array.isArray(data.items)) {
        const filtered = data.items.filter((item: any) => {
            const matches = conditions.every((condition: any) => {
                const value = getNestedProperty(item, condition.field);
                return evaluateSimpleCondition(value, condition.operator, condition.value);
            });
            return mode === 'keep' ? matches : !matches;
        });

        console.log(`[FILTER] Filtered ${data.items.length} items to ${filtered.length} items`);

        return {
            ...data,
            items: filtered,
        };
    }

    // Otherwise check if the data itself matches
    const matches = conditions.every((condition: any) => {
        const value = getNestedProperty(data, condition.field);
        return evaluateSimpleCondition(value, condition.operator, condition.value);
    });

    console.log(`[FILTER] Data ${matches ? 'passes' : 'fails'} filter`);

    return matches === (mode === 'keep') ? data : null;
}

/**
 * Merge Node
 * Combines data from multiple branches (simplified version)
 */
async function executeMerge(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const mode = config.mode || 'append'; // 'append', 'merge', 'latest'

    console.log(`[MERGE] Merging data (mode: ${mode})`);

    // In a real implementation, this would collect data from multiple branches
    // For now, we just pass through the data
    return data;
}

/**
 * Split Batches Node
 * Processes items in batches
 */
async function executeSplitBatches(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const batchSize = config.batchSize || 10;

    console.log(`[SPLIT_BATCHES] Processing in batches of ${batchSize}`);

    if (data.items && Array.isArray(data.items)) {
        const batches = [];
        for (let i = 0; i < data.items.length; i += batchSize) {
            batches.push(data.items.slice(i, i + batchSize));
        }

        console.log(`[SPLIT_BATCHES] Split ${data.items.length} items into ${batches.length} batches`);

        return {
            ...data,
            batches,
            batchCount: batches.length,
        };
    }

    return data;
}

/**
 * Slack Node
 * Sends messages to Slack channels
 */
async function executeSlack(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const message = replaceVariables(config.message || '', data);
    const webhookUrl = config.webhookUrl || '';

    console.log(`[SLACK] Sending message: "${message}"`);

    if (!webhookUrl) {
        console.warn('[SLACK] No webhook URL configured - simulating send');
        return {
            ...data,
            slack: {
                status: 'simulated',
                message,
                timestamp: Date.now(),
            },
        };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
        });

        return {
            ...data,
            slack: {
                status: response.ok ? 'sent' : 'failed',
                message,
                timestamp: Date.now(),
            },
        };
    } catch (error) {
        console.error('[SLACK] Error:', error);
        throw new Error(`Slack send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Email Node
 * Sends emails via SMTP
 */
async function executeEmail(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const to = replaceVariables(config.to || '', data);
    const subject = replaceVariables(config.subject || '', data);
    const body = replaceVariables(config.body || '', data);

    console.log(`[EMAIL] Sending email to ${to}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${body}`);

    // Simulate email send (in production, use nodemailer or similar)
    return {
        ...data,
        email: {
            status: 'simulated',
            to,
            subject,
            body,
            timestamp: Date.now(),
        },
    };
}

/**
 * Discord Node
 * Sends messages to Discord channels
 */
async function executeDiscord(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const message = replaceVariables(config.message || '', data);
    const webhookUrl = config.webhookUrl || '';

    console.log(`[DISCORD] Sending message: "${message}"`);

    if (!webhookUrl) {
        console.warn('[DISCORD] No webhook URL configured - simulating send');
        return {
            ...data,
            discord: {
                status: 'simulated',
                message,
                timestamp: Date.now(),
            },
        };
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
        });

        return {
            ...data,
            discord: {
                status: response.ok ? 'sent' : 'failed',
                message,
                timestamp: Date.now(),
            },
        };
    } catch (error) {
        console.error('[DISCORD] Error:', error);
        throw new Error(`Discord send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Telegram Node
 * Sends messages via Telegram Bot API
 */
async function executeTelegram(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const message = replaceVariables(config.message || '', data);
    const chatId = config.chatId || '';
    const botToken = config.botToken || '';

    console.log(`[TELEGRAM] Sending message to chat ${chatId}`);
    console.log(`[TELEGRAM] Message: ${message}`);

    if (!botToken || !chatId) {
        console.warn('[TELEGRAM] Missing bot token or chat ID - simulating send');
        return {
            ...data,
            telegram: {
                status: 'simulated',
                message,
                chatId,
                timestamp: Date.now(),
            },
        };
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        });

        return {
            ...data,
            telegram: {
                status: response.ok ? 'sent' : 'failed',
                message,
                chatId,
                timestamp: Date.now(),
            },
        };
    } catch (error) {
        console.error('[TELEGRAM] Error:', error);
        throw new Error(`Telegram send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * WhatsApp Node
 * Sends messages via WhatsApp Business API
 */
async function executeWhatsApp(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const operation = config.operation || 'sendMessage';
    const phoneNumber = replaceVariables(config.phoneNumber || config.to || '', data);
    const message = replaceVariables(config.message || '', data);

    // Get credentials
    const apiToken = config.apiToken || '';
    const phoneNumberId = config.phoneNumberId || '';

    console.log(`[WHATSAPP] Operation: ${operation}, To: ${phoneNumber}`);

    if (!apiToken || !phoneNumberId) {
        console.warn('[WHATSAPP] Missing credentials (apiToken or phoneNumberId) - simulating send');
        return {
            ...data,
            whatsapp: {
                status: 'simulated',
                operation,
                message,
                to: phoneNumber,
                info: 'Configure API token and Phone Number ID in credentials to use real WhatsApp API',
                timestamp: Date.now(),
            },
        };
    }

    if (!phoneNumber) {
        throw new Error('WhatsApp phone number is required');
    }

    // Normalize phone number (remove non-numeric characters except +)
    const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, '').replace(/^\+/, '');

    console.log(`[WHATSAPP] Normalized phone: ${normalizedPhone}`);

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

        let requestBody: any;

        switch (operation) {
            case 'sendMessage': {
                if (!message) {
                    throw new Error('Message content is required for sendMessage operation');
                }

                requestBody = {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: normalizedPhone,
                    type: 'text',
                    text: {
                        preview_url: false,
                        body: message
                    }
                };
                break;
            }

            case 'sendTemplate': {
                const templateName = config.templateName || 'hello_world';
                const templateLanguage = config.templateLanguage || 'en';
                const templateParams = config.templateParams || {};

                console.log(`[WHATSAPP] Using template: ${templateName}`);

                requestBody = {
                    messaging_product: 'whatsapp',
                    to: normalizedPhone,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: {
                            code: templateLanguage
                        },
                        components: Object.keys(templateParams).length > 0 ? [
                            {
                                type: 'body',
                                parameters: Object.values(templateParams).map((val: any) => ({
                                    type: 'text',
                                    text: replaceVariables(String(val), data)
                                }))
                            }
                        ] : []
                    }
                };
                break;
            }

            case 'sendMedia': {
                const mediaType = config.mediaType || 'image';
                const mediaUrl = replaceVariables(config.mediaUrl || '', data);
                const caption = replaceVariables(config.caption || '', data);

                if (!mediaUrl) {
                    throw new Error('Media URL is required for sendMedia operation');
                }

                console.log(`[WHATSAPP] Sending ${mediaType}: ${mediaUrl}`);

                const mediaField: any = {
                    link: mediaUrl
                };

                // Only add caption if provided and media type supports it
                if (caption && ['image', 'video', 'document'].includes(mediaType)) {
                    mediaField.caption = caption;
                }

                requestBody = {
                    messaging_product: 'whatsapp',
                    to: normalizedPhone,
                    type: mediaType,
                    [mediaType]: mediaField
                };
                break;
            }

            default:
                throw new Error(`Unsupported WhatsApp operation: ${operation}`);
        }

        console.log(`[WHATSAPP] Sending request to WhatsApp API...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMessage = result.error?.message || result.error?.error_data?.details || response.statusText;
            throw new Error(`WhatsApp API error: ${errorMessage}`);
        }

        console.log(`[WHATSAPP] Message sent successfully, ID: ${result.messages?.[0]?.id}`);

        return {
            ...data,
            whatsapp: {
                status: 'sent',
                operation,
                message,
                to: phoneNumber,
                messageId: result.messages?.[0]?.id,
                timestamp: Date.now(),
            },
        };
    } catch (error) {
        console.error('[WHATSAPP] Error:', error);
        throw new Error(`WhatsApp send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * OpenAI Node
 * Interacts with OpenAI API for GPT, DALL-E, embeddings
 */
async function executeOpenAI(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const operation = config.operation || 'chat';
    const apiKey = config.apiKey || '';

    // Support both new format (systemPrompt + userPrompt) and old format (prompt)
    const systemPrompt = config.systemPrompt || '';
    const userPrompt = replaceVariables(config.userPrompt || config.prompt || '', data);

    console.log(`[OPENAI] Operation: ${operation}`);
    if (systemPrompt) {
        console.log(`[OPENAI] System Prompt: ${systemPrompt.substring(0, 100)}...`);
    }
    console.log(`[OPENAI] User Prompt: ${userPrompt.substring(0, 100)}...`);

    if (!apiKey) {
        console.warn('[OPENAI] No API key configured - simulating response');
        return {
            ...data,
            openai: {
                status: 'simulated',
                operation,
                systemPrompt,
                userPrompt,
                response: 'This is a simulated OpenAI response. Configure an API key to get real results.',
                timestamp: Date.now(),
            },
        };
    }

    try {
        if (operation === 'chat') {
            // Build messages array with optional system message
            const messages: Array<{ role: string; content: string }> = [];

            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }

            messages.push({ role: 'user', content: userPrompt });

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages,
                    temperature: config.temperature || 0.7,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.error?.message || response.statusText;
                throw new Error(`OpenAI API error: ${errorMessage}`);
            }

            return {
                ...data,
                openai: {
                    status: 'success',
                    operation,
                    systemPrompt,
                    userPrompt,
                    response: result.choices[0]?.message?.content || '',
                    usage: result.usage,
                    timestamp: Date.now(),
                },
            };
        }

        return data;
    } catch (error) {
        console.error('[OPENAI] Error:', error);
        throw new Error(`OpenAI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Google Sheets Node
 * Reads/writes data from Google Sheets
 */
async function executeGoogleSheets(node: NodeProps, data: any): Promise<any> {
    const config = node.data.config || {};
    const operation = config.operation || 'append';
    const spreadsheetId = config.spreadsheetId || '';
    const sheetName = config.sheetName || 'Sheet1';
    const range = config.range || 'A:Z';

    // Get access token from credentials tab
    const accessToken = config.accessToken || '';

    console.log(`[GOOGLE_SHEETS] Operation: ${operation}`);
    console.log(`[GOOGLE_SHEETS] Spreadsheet: ${spreadsheetId}, Sheet: ${sheetName}`);

    if (!accessToken) {
        console.warn('[GOOGLE_SHEETS] No access token configured - simulating operation');
        return {
            ...data,
            googleSheets: {
                status: 'simulated',
                operation,
                spreadsheetId,
                sheetName,
                message: 'Configure access token in credentials to use real Google Sheets API',
                timestamp: Date.now(),
            },
        };
    }

    if (!spreadsheetId) {
        throw new Error('Google Sheets spreadsheet ID is required');
    }

    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

    try {
        switch (operation) {
            case 'append': {
                // Prepare values - extract from data or use configured values
                const values = config.values || extractRowFromData(data);

                console.log(`[GOOGLE_SHEETS] Appending row:`, values);

                const url = `${baseUrl}/${spreadsheetId}/values/${sheetName}!${range}:append?valueInputOption=USER_ENTERED`;

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        values: [values]
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`);
                }

                const result = await response.json();

                console.log(`[GOOGLE_SHEETS] Successfully appended ${result.updates?.updatedRows || 0} rows`);

                return {
                    ...data,
                    googleSheets: {
                        status: 'success',
                        operation: 'append',
                        spreadsheetId,
                        sheetName,
                        updatedRange: result.updates?.updatedRange,
                        updatedRows: result.updates?.updatedRows,
                        updatedColumns: result.updates?.updatedColumns,
                        updatedCells: result.updates?.updatedCells,
                        timestamp: Date.now(),
                    }
                };
            }

            case 'read': {
                const url = `${baseUrl}/${spreadsheetId}/values/${sheetName}!${range}`;

                console.log(`[GOOGLE_SHEETS] Reading range: ${sheetName}!${range}`);

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`);
                }

                const result = await response.json();

                console.log(`[GOOGLE_SHEETS] Successfully read ${result.values?.length || 0} rows`);

                return {
                    ...data,
                    googleSheets: {
                        status: 'success',
                        operation: 'read',
                        spreadsheetId,
                        sheetName,
                        values: result.values || [],
                        range: result.range,
                        rowCount: result.values?.length || 0,
                        timestamp: Date.now(),
                    }
                };
            }

            case 'update': {
                const values = config.values || extractRowFromData(data);

                console.log(`[GOOGLE_SHEETS] Updating range: ${sheetName}!${range}`);

                const url = `${baseUrl}/${spreadsheetId}/values/${sheetName}!${range}?valueInputOption=USER_ENTERED`;

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        values: [values]
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(`Google Sheets API error: ${error.error?.message || response.statusText}`);
                }

                const result = await response.json();

                console.log(`[GOOGLE_SHEETS] Successfully updated ${result.updatedRows || 0} rows`);

                return {
                    ...data,
                    googleSheets: {
                        status: 'success',
                        operation: 'update',
                        spreadsheetId,
                        sheetName,
                        updatedRange: result.updatedRange,
                        updatedRows: result.updatedRows,
                        updatedColumns: result.updatedColumns,
                        updatedCells: result.updatedCells,
                        timestamp: Date.now(),
                    }
                };
            }

            default:
                throw new Error(`Unsupported Google Sheets operation: ${operation}`);
        }
    } catch (error) {
        console.error('[GOOGLE_SHEETS] Error:', error);
        throw new Error(`Google Sheets operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Helper: Extract row data from workflow data for Google Sheets
 */
function extractRowFromData(data: any): any[] {
    // If values are explicitly provided, use them
    if (data.values && Array.isArray(data.values)) {
        return data.values;
    }

    // Try to extract from webhook body
    if (data.body && typeof data.body === 'object') {
        const bodyValues = Object.values(data.body);
        if (bodyValues.length > 0) {
            return bodyValues;
        }
    }

    // Try to extract from query params
    if (data.query && typeof data.query === 'object') {
        const queryValues = Object.values(data.query);
        if (queryValues.length > 0) {
            return queryValues;
        }
    }

    // Extract from root level, excluding internal fields
    const excludeKeys = ['googleSheets', 'openai', 'telegram', 'whatsapp', 'slack', 'discord', 'email', 'http', 'headers', 'params', 'method', 'path'];
    const keys = Object.keys(data).filter(k => !excludeKeys.includes(k));

    if (keys.length > 0) {
        return keys.map(k => data[k]);
    }

    // Fallback: return empty array
    return [];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Replace {{variable}} placeholders with actual data values
 */
function replaceVariables(template: string, data: any): string {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = getNestedProperty(data, path.trim());
        return value !== undefined ? String(value) : match;
    });
}

/**
 * Get nested property from object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Set nested property in object using dot notation
 */
function setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((current, prop) => {
        if (!current[prop]) current[prop] = {};
        return current[prop];
    }, obj);
    if (last) target[last] = value;
}

/**
 * Evaluate simple comparison conditions
 */
function evaluateSimpleCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
        case 'equals':
        case '==':
            return value == compareValue;
        case 'notEquals':
        case '!=':
            return value != compareValue;
        case 'greaterThan':
        case '>':
            return value > compareValue;
        case 'lessThan':
        case '<':
            return value < compareValue;
        case 'contains':
            return String(value).includes(String(compareValue));
        case 'startsWith':
            return String(value).startsWith(String(compareValue));
        case 'endsWith':
            return String(value).endsWith(String(compareValue));
        default:
            return false;
    }
}