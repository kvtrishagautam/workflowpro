/**
 * Webhook Node Configuration Types
 * Based on n8n webhook node features
 */

// HTTP Methods supported by webhook
export type WebhookHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

// Authentication types
export type WebhookAuthType = 'none' | 'basicAuth' | 'headerAuth';

// Response mode options
export type WebhookResponseMode = 'immediately' | 'lastNode' | 'responseNode';

// Response data options (when responseMode is 'lastNode')
export type WebhookResponseData = 'allEntries' | 'firstEntryJson' | 'firstEntryBinary' | 'noResponseBody';

// Common HTTP Response Codes
export type WebhookResponseCode = 200 | 201 | 202 | 204 | 301 | 302 | 400 | 401 | 403 | 404 | 500;

// Basic Auth credentials
export interface BasicAuthCredentials {
  username: string;
  password: string;
}

// Header Auth credentials
export interface HeaderAuthCredentials {
  headerName: string;
  headerValue: string;
}

// Webhook node options (advanced settings)
export interface WebhookOptions {
  // CORS settings
  allowedOrigins?: string; // Comma-separated list or '*'

  // Binary data handling
  binaryPropertyName?: string; // Name for binary data property

  // Bot filtering
  ignoreBots?: boolean;

  // IP filtering
  ipWhitelist?: string; // Comma-separated IP addresses

  // Response customization
  noResponseBody?: boolean;
  rawBody?: boolean;
  responseContentType?: string;
  customResponseData?: string; // Custom response data
  responseHeaders?: Record<string, string>;

  // Property name for response (when using firstEntryJson)
  propertyName?: string;
}

// Main webhook configuration
export interface WebhookConfig {
  // Basic settings
  path: string;                          // e.g. /order-created or /:orderId/status
  httpMethod: WebhookHttpMethod;         // HTTP method to listen for

  // Authentication - using string to avoid babel parser issues with 'as' keyword
  authentication: WebhookAuthType | string;
  basicAuthCredentials?: BasicAuthCredentials;
  headerAuthCredentials?: HeaderAuthCredentials;

  // Response configuration - using string/number for compatibility
  responseMode: WebhookResponseMode;
  responseCode: WebhookResponseCode | number;
  responseData?: WebhookResponseData | string;

  // Advanced options
  options: WebhookOptions;
}

// Default webhook configuration
export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  path: '/webhook-' + Math.random().toString(36).substring(2, 8),
  httpMethod: 'POST',
  authentication: 'none',
  responseMode: 'immediately',
  responseCode: 200,
  responseData: 'firstEntryJson',
  options: {
    allowedOrigins: '*',
    ignoreBots: false,
    rawBody: false,
    noResponseBody: false,
  },
};

// Helper function to generate webhook URLs
export function getWebhookUrls(path: string, baseUrl: string = 'http://localhost:4000'): {
  testUrl: string;
  productionUrl: string;
} {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return {
    testUrl: `${baseUrl}/webhook/test${normalizedPath}`,
    productionUrl: `${baseUrl}/webhook${normalizedPath}`,
  };
}

// Validate webhook path (supports route parameters like /:id)
export function isValidWebhookPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;

  // Must start with /
  if (!path.startsWith('/')) return false;

  // Check for valid path characters and route parameters
  const pathPattern = /^\/[a-zA-Z0-9\-_\/:]*$/;
  return pathPattern.test(path);
}

// Parse route parameters from path
export function parseRouteParams(path: string): string[] {
  const paramPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const params: string[] = [];
  let match;

  while ((match = paramPattern.exec(path)) !== null) {
    params.push(match[1]);
  }

  return params;
}
