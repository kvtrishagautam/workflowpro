import { WorkflowNode, NodeInput, NodeExecutionResult } from '../types/node';
import { google } from 'googleapis';

/**
 * Google Sheets Node
 * Supports read and write operations with Google Sheets API v4
 * 
 * Operations:
 * - read: Read data from a specified range
 * - append: Append rows to existing sheet
 * - appendToNewTab: Create a new tab and write data
 * - writeToNewSheet: Write data to a different spreadsheet
 */

interface GoogleSheetsConfig {
    operation: 'read' | 'append' | 'appendToNewTab' | 'writeToNewSheet';
    spreadsheetId: string;
    sheetName: string;
    range: string;
    outputSpreadsheetId?: string;
    outputTabName?: string;
    includeHeaders?: boolean;
    formatForVisualization?: boolean;
    serviceAccountJson?: string;
}

export const googleSheetsNode: WorkflowNode = {
    id: 'googleSheets',
    type: 'GOOGLE_SHEETS',
    name: 'Google Sheets Node',
    description: 'Read from and write to Google Sheets',
    inputSchema: {
        type: 'object',
        properties: {
            operation: { type: 'string', enum: ['read', 'append', 'appendToNewTab', 'writeToNewSheet'] },
            spreadsheetId: { type: 'string' },
            sheetName: { type: 'string' },
            range: { type: 'string' },
            data: { type: 'array' },
        },
    },
    outputSchema: { type: 'object' },
    execute: async (input: NodeInput): Promise<NodeExecutionResult> => {
        try {
            const config = input as GoogleSheetsConfig;

            console.log(`[GoogleSheets] Executing operation: ${config.operation}`);
            console.log(`[GoogleSheets] Spreadsheet ID: ${config.spreadsheetId}`);

            // Initialize Google Sheets API client
            const auth = await getAuthClient(config.serviceAccountJson);

            // Handle different auth types
            const sheets = typeof auth === 'string'
                ? google.sheets({ version: 'v4', auth: auth }) // API Key
                : auth
                    ? google.sheets({ version: 'v4', auth: auth as any }) // OAuth client
                    : google.sheets({ version: 'v4' }); // No auth (will likely fail)

            switch (config.operation) {
                case 'read':
                    return await readFromSheet(sheets, config);

                case 'append':
                    if (!auth) throw new Error('Authentication required for write operations');
                    return await appendToSheet(sheets, config, input.data);

                case 'appendToNewTab':
                    if (!auth) throw new Error('Authentication required for write operations');
                    return await appendToNewTab(sheets, config, input.data);

                case 'writeToNewSheet':
                    if (!auth) throw new Error('Authentication required for write operations');
                    return await writeToNewSheet(sheets, config, input.data);

                default:
                    throw new Error(`Unsupported operation: ${config.operation}`);
            }
        } catch (error: any) {
            console.error('[GoogleSheets] Error:', error);
            return {
                status: 'error',
                error: error.message || 'Unknown error occurred',
            };
        }
    },
};

/**
 * Get authenticated Google Sheets API client
 * Supports three authentication methods:
 * 1. Service Account JSON (serviceAccountJson)
 * 2. OAuth2 client credentials (oauthClientJson + accessToken)
 * 3. No authentication (for public sheets)
 */
async function getAuthClient(serviceAccountJson?: string, oauthClientJson?: string, accessToken?: string) {
    try {
        // Method 1: Service Account
        if (serviceAccountJson) {
            const credentials = JSON.parse(serviceAccountJson);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            return await auth.getClient();
        }

        // Method 2: OAuth2 (User Account)
        if (oauthClientJson && accessToken) {
            const oauthCredentials = JSON.parse(oauthClientJson);
            const oauth2Client = new google.auth.OAuth2(
                oauthCredentials.client_id,
                oauthCredentials.client_secret,
                oauthCredentials.redirect_uris[0]
            );
            oauth2Client.setCredentials({ access_token: accessToken });
            return oauth2Client;
        }

        // Method 3: Environment variable fallback
        const envCreds = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        if (envCreds) {
            const credentials = JSON.parse(envCreds);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            return await auth.getClient();
        }

        // Method 4: API Key (for public sheets - read only)
        const apiKey = process.env.GOOGLE_API_KEY;
        if (apiKey) {
            console.log('[GoogleSheets] Using API Key for public sheet access');
            return apiKey; // Return API key string instead of auth client
        }

        // Method 5: No authentication
        console.log('[GoogleSheets] WARNING: No credentials provided - API calls may fail');
        return null;
    } catch (error: any) {
        console.error('[GoogleSheets] Auth error:', error);
        throw new Error(`Authentication failed: ${error.message}`);
    }
}

/**
 * Read data from Google Sheet
 */
async function readFromSheet(
    sheets: any,
    config: GoogleSheetsConfig
): Promise<NodeExecutionResult> {
    try {
        const range = `${config.sheetName}!${config.range}`;

        console.log(`[GoogleSheets] Reading from range: ${range}`);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: config.spreadsheetId,
            range: range,
        });

        const rows = response.data.values || [];

        console.log(`[GoogleSheets] Read ${rows.length} rows`);

        // Format data as array of objects if headers are present
        let formattedData = rows;

        if (config.includeHeaders !== false && rows.length > 0) {
            const headers = rows[0];
            formattedData = rows.slice(1).map((row: any[]) => {
                const obj: any = {};
                headers.forEach((header: string, index: number) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        }

        return {
            status: 'success',
            data: {
                rows: formattedData,
                totalRows: rows.length,
                range: range,
                spreadsheetId: config.spreadsheetId,
            },
        };
    } catch (error: any) {
        console.error('[GoogleSheets] Read error:', error);
        throw new Error(`Failed to read from sheet: ${error.message}`);
    }
}

/**
 * Append data to existing sheet
 */
async function appendToSheet(
    sheets: any,
    config: GoogleSheetsConfig,
    data: any
): Promise<NodeExecutionResult> {
    try {
        const range = `${config.sheetName}!${config.range}`;

        // Convert data to 2D array format
        const values = formatDataForSheets(data, config.formatForVisualization);

        console.log(`[GoogleSheets] Appending ${values.length} rows to ${range}`);

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: config.spreadsheetId,
            range: range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });

        return {
            status: 'success',
            data: {
                updatedRange: response.data.updates?.updatedRange,
                updatedRows: response.data.updates?.updatedRows,
                updatedCells: response.data.updates?.updatedCells,
            },
        };
    } catch (error: any) {
        console.error('[GoogleSheets] Append error:', error);
        throw new Error(`Failed to append to sheet: ${error.message}`);
    }
}

/**
 * Create a new tab and write data
 */
async function appendToNewTab(
    sheets: any,
    config: GoogleSheetsConfig,
    data: any
): Promise<NodeExecutionResult> {
    try {
        const tabName = config.outputTabName || `Processed_${Date.now()}`;

        console.log(`[GoogleSheets] Creating new tab: ${tabName}`);

        // Create new sheet tab
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: config.spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: tabName,
                            },
                        },
                    },
                ],
            },
        });

        // Write data to new tab
        const values = formatDataForSheets(data, config.formatForVisualization);

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: config.spreadsheetId,
            range: `${tabName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });

        return {
            status: 'success',
            data: {
                tabName: tabName,
                updatedRange: response.data.updatedRange,
                updatedRows: response.data.updatedRows,
                updatedCells: response.data.updatedCells,
            },
        };
    } catch (error: any) {
        console.error('[GoogleSheets] Create new tab error:', error);
        throw new Error(`Failed to create new tab: ${error.message}`);
    }
}

/**
 * Write data to a different spreadsheet
 */
async function writeToNewSheet(
    sheets: any,
    config: GoogleSheetsConfig,
    data: any
): Promise<NodeExecutionResult> {
    try {
        const targetSpreadsheetId = config.outputSpreadsheetId || config.spreadsheetId;
        const targetSheetName = config.sheetName;

        console.log(`[GoogleSheets] Writing to spreadsheet: ${targetSpreadsheetId}`);

        const values = formatDataForSheets(data, config.formatForVisualization);

        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: targetSpreadsheetId,
            range: `${targetSheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: values,
            },
        });

        return {
            status: 'success',
            data: {
                spreadsheetId: targetSpreadsheetId,
                updatedRange: response.data.updatedRange,
                updatedRows: response.data.updatedRows,
                updatedCells: response.data.updatedCells,
            },
        };
    } catch (error: any) {
        console.error('[GoogleSheets] Write to new sheet error:', error);
        throw new Error(`Failed to write to new sheet: ${error.message}`);
    }
}

/**
 * Format data for Google Sheets
 * Converts various data formats to 2D array suitable for Sheets API
 */
function formatDataForSheets(data: any, formatForVisualization: boolean = true): any[][] {
    if (!data) {
        return [];
    }

    // If data is already a 2D array, return as-is
    if (Array.isArray(data) && Array.isArray(data[0])) {
        return data;
    }

    // If data is from a previous node (has rows property)
    if (data.rows && Array.isArray(data.rows)) {
        data = data.rows;
    }

    // If data is array of objects, convert to 2D array with headers
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const headers = Object.keys(data[0]);
        const rows = data.map((item: any) =>
            headers.map(header => {
                const value = item[header];
                // Format for visualization: preserve data types
                if (formatForVisualization) {
                    // Keep numbers as numbers, dates as dates
                    if (typeof value === 'number') return value;
                    if (value instanceof Date) return value.toISOString();
                    return value !== undefined && value !== null ? String(value) : '';
                }
                return value !== undefined && value !== null ? String(value) : '';
            })
        );

        // Include headers as first row
        return [headers, ...rows];
    }

    // Single value or unsupported format
    return [[String(data)]];
}

// Export for use in node registry
export default googleSheetsNode;
