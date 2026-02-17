import { ExecutionContext, ExecutionResult } from '../types';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { get } from 'lodash';

/**
 * HTTP Node Executor
 * Makes HTTP requests to external APIs
 */
export class HTTPExecutor {
    /**
     * Execute HTTP request
     * @param context - Execution context containing node configuration
     * @returns Execution result with API response data
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        try {
            const {
                method,
                url,
                headers,
                body,
                authType,
                bearerToken,
                apiKey,
                apiKeyHeader,
                basicAuthUsername,
                basicAuthPassword,
                timeout
            } = context.data.config;

            if (!url) {
                throw new Error('URL is required');
            }

            // Default to GET if method is missing
            const methodToUse = method || 'GET';

            console.log('🌐 HTTP Executor Config:', { url, method: methodToUse, authType });

            if (!url) {
                throw new Error('URL is required');
            }


            // Variable replacement helper
            const processTemplate = (template: string) => {
                if (!template) return '';
                return template.replace(/\${([^}]+)}/g, (_, path) => {
                    const cleanPath = path.replace('data.', '');
                    const value = get(context.previousNodeOutput, cleanPath);
                    return value !== undefined ? value : '';
                });
            };

            // Process URL with variables
            const processedUrl = processTemplate(url);

            // Build headers
            const requestHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                ...headers
            };

            // Add authentication
            if (authType === 'bearer' && bearerToken) {
                requestHeaders['Authorization'] = `Bearer ${processTemplate(bearerToken)}`;
            } else if (authType === 'apiKey' && apiKey && apiKeyHeader) {
                requestHeaders[apiKeyHeader] = processTemplate(apiKey);
            }

            // Build request config
            const config: AxiosRequestConfig = {
                method: methodToUse.toUpperCase() as Method,
                url: processedUrl,
                headers: requestHeaders,
                timeout: timeout || 30000
            };

            // Add basic auth if specified
            if (authType === 'basic' && basicAuthUsername && basicAuthPassword) {
                config.auth = {
                    username: processTemplate(basicAuthUsername),
                    password: processTemplate(basicAuthPassword)
                };
            }

            // Add body for POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(methodToUse.toUpperCase()) && body) {
                // Try to parse body as JSON if it's a string
                if (typeof body === 'string') {
                    const processedBody = processTemplate(body);
                    try {
                        config.data = JSON.parse(processedBody);
                    } catch {
                        config.data = processedBody;
                    }
                } else {
                    // If body is an object, process each value
                    const processedBody: any = {};
                    for (const [key, value] of Object.entries(body)) {
                        processedBody[key] = typeof value === 'string' ? processTemplate(value) : value;
                    }
                    config.data = processedBody;
                }
            }

            // Make the request
            const response = await axios(config);

            return {
                success: true,
                data: {
                    ...context.previousNodeOutput,
                    httpResult: {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        data: response.data
                    }
                }
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            const statusCode = error.response?.status;

            return {
                success: false,
                error: `HTTP error${statusCode ? ` (${statusCode})` : ''}: ${errorMessage}`
            };
        }
    }
}

// Export singleton instance
export const httpExecutor = new HTTPExecutor();
