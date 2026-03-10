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
            let credentialInput: any = null;
            let credentialSource = 'none';

            // 1. Prioritize accessToken if provided (OAuth)
            if (config.accessToken) {
                credentialInput = config.accessToken;
                credentialSource = 'accessToken_field';
            }
            // 2. Otherwise try Service Account JSON fields
            else if (config.serviceAccountJson || config.googleServiceAccount) {
                credentialInput = config.serviceAccountJson || config.googleServiceAccount;
                credentialSource = 'serviceAccount_field';
            }
            // 3. Fallback to system-wide environment variable
            else if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
                credentialInput = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
                credentialSource = 'env_fallback';
            }

            if (!credentialInput) {
                throw new Error('No Google Sheets credentials provided. Please add an Access Token or Service Account JSON in the node configuration.');
            }

            console.log(`📊 [GOOGLE_SHEETS] Auth source: ${credentialSource}, Type: ${typeof credentialInput}`);

            try {
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
                            if (!keys.client_email || !keys.private_key) {
                                throw new Error('Missing client_email or private_key in Service Account JSON');
                            }
                            const googleAuth = new google.auth.GoogleAuth({
                                credentials: {
                                    client_email: keys.client_email,
                                    private_key: keys.private_key,
                                },
                                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                            });
                            auth = await googleAuth.getClient();
                        } catch (e: any) {
                            throw new Error(`Invalid Service Account JSON: ${e.message}`);
                        }
                    } else {
                        // Assume it's an Access Token (OAuth)
                        let token = trimmed;
                        // Strip "Bearer " if present
                        if (token.toLowerCase().startsWith('bearer ')) {
                            token = token.slice(7).trim();
                        }

                        console.log(`📊 [GOOGLE_SHEETS] Using OAuth Access Token (starts with: ${token.substring(0, 5)}...)`);

                        const oAuth2Client = new google.auth.OAuth2();
                        oAuth2Client.setCredentials({ access_token: token });
                        auth = oAuth2Client;
                    }
                }
            } catch (authError: any) {
                console.error('❌ [GOOGLE_SHEETS] Auth initialization error:', authError.message);
                throw new Error(`Google Sheets Authentication failed: ${authError.message}`);
            }

            const sheets = google.sheets({ version: 'v4', auth: auth as any });

            // Replace variables in values
            const processValue = (val: string) => {
                if (typeof val !== 'string') return val;
                return val.replace(/\${([^}]+)}/g, (_, path) => {
                    const cleanPath = path.replace('data.', '').trim();
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
                    console.log(`📊 [GOOGLE_SHEETS] Sending append request to Spreadsheet: ${spreadsheetId}, Range: ${range}`);
                    const response = await sheets.spreadsheets.values.append({
                        spreadsheetId,
                        range,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: {
                            values: [values]
                        },
                        auth: auth as any // Explicitly pass auth
                    });
                    console.log('✅ [GOOGLE_SHEETS] API Response Success:', response.data.updates?.updatedRange);
                } catch (apiError: any) {
                    console.error('❌ [GOOGLE_SHEETS] API Error Details:', {
                        message: apiError.message,
                        status: apiError.status,
                        errors: apiError.errors
                    });
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
