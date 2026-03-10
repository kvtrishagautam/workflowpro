"use strict";
/**
 * Node Executor Service
 * Executes workflow nodes on the backend
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeNode = executeNode;
const node_fetch_1 = __importDefault(require("node-fetch"));
/**
 * Execute a single node based on its type
 */
async function executeNode(node, data) {
    console.log(`[EXECUTE] ${node.type} node (${node.id})`);
    // Support both React Flow structure (node.data.config) and direct structure (node.config)
    const config = node.data?.config || node.config || {};
    switch (node.type) {
        case 'webhook':
            return executeWebhook(node, data, config);
        case 'googleSheets':
            return await executeGoogleSheets(node, data, config);
        case 'openai':
            return await executeOpenAI(node, data, config);
        case 'set':
            return executeSet(node, data, config);
        case 'telegram':
            return await executeTelegram(node, data, config);
        case 'whatsapp':
            return await executeWhatsApp(node, data, config);
        default:
            console.warn(`[WARN] Unsupported node type: ${node.type}`);
            return data;
    }
}
/**
 * Webhook Node - Just pass through data
 */
function executeWebhook(node, data, config) {
    console.log(`[WEBHOOK] Passing through data`);
    return data;
}
/**
 * Google Sheets Node - Append/Read/Update
 */
async function executeGoogleSheets(node, data, config) {
    const operation = config.operation || 'append';
    const spreadsheetId = extractSpreadsheetId(config.spreadsheetId || '');
    const sheetName = config.sheetName || 'Sheet1';
    const range = config.range || 'A:Z';
    const accessToken = config.accessToken || '';
    console.log(`[GOOGLE_SHEETS] Operation: ${operation}`);
    console.log(`[GOOGLE_SHEETS] Spreadsheet: ${spreadsheetId}, Sheet: ${sheetName}`);
    if (!accessToken) {
        console.warn('[GOOGLE_SHEETS] No access token - simulating');
        return {
            ...data,
            googleSheets: {
                status: 'simulated',
                operation,
                message: 'No access token configured',
            },
        };
    }
    if (!spreadsheetId) {
        throw new Error('Google Sheets spreadsheet ID is required');
    }
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    try {
        if (operation === 'append') {
            // Extract row data with proper field order
            const values = extractRowDataInOrder(data);
            console.log(`[GOOGLE_SHEETS] Appending row:`, values);
            const url = `${baseUrl}/${spreadsheetId}/values/${encodeURIComponent(sheetName + '!' + range)}:append?valueInputOption=USER_ENTERED`;
            const response = await (0, node_fetch_1.default)(url, {
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
            console.log(`[GOOGLE_SHEETS] ✅ Row appended successfully`);
            return {
                ...data,
                googleSheets: {
                    status: 'success',
                    operation: 'append',
                    spreadsheetId,
                    sheetName,
                    updatedRange: result.updates?.updatedRange,
                    updatedRows: result.updates?.updatedRows,
                    timestamp: Date.now(),
                },
            };
        }
        return data;
    }
    catch (error) {
        console.error('[GOOGLE_SHEETS] Error:', error);
        throw error;
    }
}
/**
 * OpenAI Node - Chat completion (supports OpenAI and Gemini!)
 */
async function executeOpenAI(node, data, config) {
    const operation = config.operation || 'chat';
    const apiKey = config.apiKey || config.openaiApiKey || '';
    const model = config.model || 'gpt-3.5-turbo';
    const temperature = config.temperature || 0.7;
    // Support both systemPrompt/userPrompt and old prompt field
    const systemPrompt = config.systemPrompt || '';
    const userPrompt = replaceVariables(config.userPrompt || config.prompt || '', data);
    // Detect if user wants to use Gemini (Google AI)
    const isGemini = model.toLowerCase().includes('gemini');
    console.log(`[${isGemini ? 'GEMINI' : 'OPENAI'}] Operation: ${operation}`);
    console.log(`[${isGemini ? 'GEMINI' : 'OPENAI'}] Model: ${model}`);
    if (systemPrompt) {
        console.log(`[${isGemini ? 'GEMINI' : 'OPENAI'}] System: ${systemPrompt.substring(0, 50)}...`);
    }
    console.log(`[${isGemini ? 'GEMINI' : 'OPENAI'}] Prompt: ${userPrompt.substring(0, 100)}...`);
    if (!apiKey) {
        console.warn(`[${isGemini ? 'GEMINI' : 'OPENAI'}] No API key - simulating`);
        return {
            ...data,
            openai: {
                status: 'simulated',
                operation,
                response: 'This is a simulated AI response. Add an API key to get real results.',
            },
        };
    }
    try {
        let aiResponse = '';
        if (isGemini) {
            // Use Google Gemini API (FREE!)
            let fullPrompt = userPrompt;
            if (systemPrompt) {
                fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            }
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await (0, node_fetch_1.default)(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                            parts: [{
                                    text: fullPrompt
                                }]
                        }],
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: 1024,
                    }
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
            }
            const result = await response.json();
            aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log(`[GEMINI] ✅ Response received (${aiResponse.length} chars)`);
        }
        else {
            // Use OpenAI API
            const messages = [];
            if (systemPrompt) {
                messages.push({ role: 'system', content: systemPrompt });
            }
            messages.push({ role: 'user', content: userPrompt });
            const response = await (0, node_fetch_1.default)('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
            }
            const result = await response.json();
            aiResponse = result.choices[0]?.message?.content || '';
            console.log(`[OPENAI] ✅ Response received (${aiResponse.length} chars)`);
        }
        return {
            ...data,
            openai: {
                status: 'success',
                operation,
                systemPrompt,
                userPrompt,
                response: aiResponse,
                model: model,
                timestamp: Date.now(),
            },
        };
    }
    catch (error) {
        console.error(`[${isGemini ? 'GEMINI' : 'OPENAI'}] Error:`, error);
        throw error;
    }
}
/**
 * Set Node - Set/transform data
 */
function executeSet(node, data, config) {
    console.log(`[SET] Transforming data`);
    const fields = config.fields || [];
    const result = { ...data };
    fields.forEach((field) => {
        const name = field.name;
        const value = replaceVariables(field.value || '', data);
        console.log(`[SET] Set ${name} = ${value.substring(0, 50)}...`);
        result[name] = value;
    });
    return result;
}
/**
 * Telegram Node - Send message
 */
async function executeTelegram(node, data, config) {
    const operation = config.operation || 'sendMessage';
    const botToken = config.botToken || config.telegramBotToken || '';
    const chatId = config.chatId || '';
    const message = replaceVariables(config.message || '', data);
    const parseMode = config.parseMode || 'text';
    console.log(`[TELEGRAM] Operation: ${operation}`);
    console.log(`[TELEGRAM] Chat ID: ${chatId}`);
    console.log(`[TELEGRAM] Message: ${message.substring(0, 100)}...`);
    if (!botToken || !chatId) {
        console.warn('[TELEGRAM] Missing credentials - simulating');
        return {
            ...data,
            telegram: {
                status: 'simulated',
                operation,
                message: 'No bot token or chat ID configured',
            },
        };
    }
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: parseMode === 'text' ? undefined : parseMode,
            }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Telegram API error: ${error.description || response.statusText}`);
        }
        const result = await response.json();
        console.log(`[TELEGRAM] ✅ Message sent, ID: ${result.result?.message_id}`);
        return {
            ...data,
            telegram: {
                status: 'success',
                operation,
                chatId,
                messageId: result.result?.message_id,
                timestamp: Date.now(),
            },
        };
    }
    catch (error) {
        console.error('[TELEGRAM] Error:', error);
        throw error;
    }
}
/**
 * WhatsApp Node - Send message
 */
async function executeWhatsApp(node, data, config) {
    const operation = config.operation || 'sendMessage';
    const apiToken = config.apiToken || '';
    const phoneNumberId = config.phoneNumberId || '';
    const phoneNumber = replaceVariables(config.phoneNumber || config.to || '', data);
    const message = replaceVariables(config.message || '', data);
    console.log(`[WHATSAPP] Operation: ${operation}`);
    console.log(`[WHATSAPP] To: ${phoneNumber}`);
    console.log(`[WHATSAPP] Message: ${message.substring(0, 100)}...`);
    if (!apiToken || !phoneNumberId) {
        console.warn('[WHATSAPP] Missing credentials - simulating');
        return {
            ...data,
            whatsapp: {
                status: 'simulated',
                operation,
                message: 'No API token or phone number ID configured',
            },
        };
    }
    try {
        // Normalize phone number (remove spaces, dashes, etc.)
        const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
        const requestBody = {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
        };
        if (operation === 'sendMessage') {
            requestBody.type = 'text';
            requestBody.text = { body: message };
        }
        const response = await (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`WhatsApp API error: ${error.error?.message || response.statusText}`);
        }
        const result = await response.json();
        console.log(`[WHATSAPP] ✅ Message sent, ID: ${result.messages?.[0]?.id}`);
        return {
            ...data,
            whatsapp: {
                status: 'success',
                operation,
                to: phoneNumber,
                messageId: result.messages?.[0]?.id,
                timestamp: Date.now(),
            },
        };
    }
    catch (error) {
        console.error('[WHATSAPP] Error:', error);
        throw error;
    }
}
/**
 * Helper: Replace variables like {{body.name}} with actual values
 */
function replaceVariables(template, data) {
    if (!template)
        return '';
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let value = data;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                // If path not found, try without 'body' prefix
                if (keys[0] === 'body' && keys.length > 1) {
                    // Try accessing data directly without 'body' prefix
                    const directValue = data[keys[1]];
                    if (directValue !== undefined) {
                        return String(directValue);
                    }
                }
                return match; // Keep original if path not found
            }
        }
        return String(value);
    });
}
/**
 * Helper: Extract spreadsheet ID from URL or ID
 */
function extractSpreadsheetId(input) {
    if (!input)
        return '';
    // If it's a URL, extract the ID
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        return match[1];
    }
    // Otherwise assume it's already an ID
    return input;
}
/**
 * Helper: Extract row data in correct order for Google Sheets
 */
function extractRowDataInOrder(data) {
    // Expected column order for business form workflow:
    // Name, Email, Phone, Company, Category, Budget, Message, Urgency, Timestamp
    const body = data.body || data;
    return [
        body.name || '',
        body.email || '',
        body.phone || '',
        body.company || '',
        body.category || '',
        body.budget || '',
        body.message || '',
        body.urgency || '',
        body.timestamp || new Date().toISOString(),
    ];
}
