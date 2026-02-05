import { ExecutionContext, ExecutionResult } from '../types';
import { google } from 'googleapis';
import { get } from 'lodash';

export class GoogleSheetsExecutor {
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const { data, previousNodeOutput } = context;
            const config = data.config;
            const operation = config.operation || 'append';

            // Auth
            let auth;
            // Combined credential field might contain JSON or Token
            const credentialInput = config.serviceAccountJson || config.googleServiceAccount || config.accessToken;

            if (!credentialInput) {
                throw new Error('No valid Google Sheets credentials provided');
            }

            if (typeof credentialInput === 'object') {
                // Already an object (unlikely from frontend but possible internally)
                const googleAuth = new google.auth.GoogleAuth({
                    credentials: {
                        client_email: credentialInput.client_email,
                        private_key: credentialInput.private_key,
                    },
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });
                auth = await googleAuth.getClient();
            } else if (typeof credentialInput === 'string') {
                const trimmed = credentialInput.trim();
                if (trimmed.startsWith('{')) {
                    // It's a JSON string (Service Account)
                    try {
                        const keys = JSON.parse(trimmed);
                        const googleAuth = new google.auth.GoogleAuth({
                            credentials: {
                                client_email: keys.client_email,
                                private_key: keys.private_key,
                            },
                            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                        });
                        auth = await googleAuth.getClient();
                    } catch (e) {
                        throw new Error('Invalid Service Account JSON format');
                    }
                } else {
                    // Assume it's an Access Token (OAuth)
                    const oAuth2Client = new google.auth.OAuth2();
                    oAuth2Client.setCredentials({ access_token: trimmed });
                    auth = oAuth2Client;
                }
            }

            const sheets = google.sheets({ version: 'v4', auth: auth as any });

            // Replace variables in values
            const processValue = (val: string) => {
                if (typeof val !== 'string') return val;
                return val.replace(/\${([^}]+)}/g, (_, path) => {
                    const cleanPath = path.replace('data.', '');
                    const value = get(previousNodeOutput, cleanPath);
                    return value !== undefined ? value : '';
                });
            };

            if (operation === 'append') {
                const spreadsheetId = config.spreadsheetId;
                const range = config.sheetName ? `${config.sheetName}!${config.range || 'A:A'}` : config.range;

                let values = [];
                if (typeof config.values === 'string') {
                    // Try to parse JSON array
                    try {
                        let parsed = JSON.parse(config.values);
                        // Process variables in the array
                        if (Array.isArray(parsed)) {
                            values = parsed.map(processValue);
                        }
                    } catch (e) {
                        // usage as raw string?
                        values = [processValue(config.values)];
                    }
                } else if (Array.isArray(config.values)) {
                    values = config.values.map(processValue);
                }

                console.log('📊 Google Sheets Operation:', operation);
                console.log('📊 Spreadsheet ID:', spreadsheetId);
                console.log('📊 Range:', range);
                console.log('📊 Values to Append:', JSON.stringify(values, null, 2));

                try {
                    await sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: {
                            values: [values]
                        }
                    });
                } catch (apiError: any) {
                    if (apiError.message && (apiError.message.includes('Unable to parse range') || apiError.message.includes('grid_id'))) {
                        throw new Error(`Google Sheets Error: Unable to access sheet '${config.sheetName}'. Please check if the Sheet Name exists exactly as typed in your spreadsheet.`);
                    }
                    throw apiError;
                }

                return {
                    success: true,
                    data: {
                        ...previousNodeOutput,
                        googleSheetsResult: { message: 'Row appended successfully' }
                    }
                };
            }

            return { success: true, data: previousNodeOutput };

        } catch (error: any) {
            return {
                success: false,
                data: null,
                error: error.message
            };
        }
    }
}

export const googleSheetsExecutor = new GoogleSheetsExecutor();
