import React, { useState, useEffect } from 'react';
import {
    WebhookConfig,
    WebhookHttpMethod,
    WebhookAuthType,
    WebhookResponseMode,
    WebhookResponseData,
    WebhookResponseCode,
    DEFAULT_WEBHOOK_CONFIG,
    getWebhookUrls,
    isValidWebhookPath,
    parseRouteParams,
} from '../types/nodes/webhook';
import './WebhookConfigPanel.css';

interface WebhookConfigPanelProps {
    config: Partial<WebhookConfig>;
    onConfigChange: (config: WebhookConfig) => void;
    onClose: () => void;
    isOpen: boolean;
}

const HTTP_METHODS: WebhookHttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];

const AUTH_TYPES: { value: WebhookAuthType; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'basicAuth', label: 'Basic Auth' },
    { value: 'headerAuth', label: 'Header Auth' },
];

const RESPONSE_MODES: { value: WebhookResponseMode; label: string; description: string }[] = [
    { value: 'immediately', label: 'Immediately', description: 'Respond right away with status message' },
    { value: 'lastNode', label: 'When Last Node Finishes', description: 'Wait for workflow to complete' },
    { value: 'responseNode', label: 'Using Response Node', description: 'Use a Respond to Webhook node' },
];

const RESPONSE_DATA_OPTIONS: { value: WebhookResponseData; label: string }[] = [
    { value: 'allEntries', label: 'All Entries' },
    { value: 'firstEntryJson', label: 'First Entry JSON' },
    { value: 'firstEntryBinary', label: 'First Entry Binary' },
    { value: 'noResponseBody', label: 'No Response Body' },
];

const RESPONSE_CODES: WebhookResponseCode[] = [200, 201, 202, 204, 301, 302, 400, 401, 403, 404, 500];

const WebhookConfigPanel: React.FC<WebhookConfigPanelProps> = ({
    config,
    onConfigChange,
    onClose,
    isOpen,
}) => {
    const [localConfig, setLocalConfig] = useState<WebhookConfig>({
        ...DEFAULT_WEBHOOK_CONFIG,
        ...config,
        options: { ...DEFAULT_WEBHOOK_CONFIG.options, ...config.options },
    });

    const [activeTab, setActiveTab] = useState<'basic' | 'auth' | 'response' | 'options'>('basic');
    const [pathError, setPathError] = useState<string | null>(null);
    const [urlMode, setUrlMode] = useState<'test' | 'production'>('test');

    useEffect(() => {
        if (config) {
            setLocalConfig({
                ...DEFAULT_WEBHOOK_CONFIG,
                ...config,
                options: { ...DEFAULT_WEBHOOK_CONFIG.options, ...config.options },
            });
        }
    }, [config]);

    const handleConfigUpdate = (updates: Partial<WebhookConfig>) => {
        const newConfig = { ...localConfig, ...updates };
        setLocalConfig(newConfig);
    };

    const handleOptionsUpdate = (updates: Partial<typeof localConfig.options>) => {
        const newConfig = {
            ...localConfig,
            options: { ...localConfig.options, ...updates },
        };
        setLocalConfig(newConfig);
    };

    // Helper handlers to work around babel parser issues
    function handleAuthChange(e: React.ChangeEvent<HTMLSelectElement>): void {
        // Value comes from controlled select with AUTH_TYPES options
        const update: Partial<WebhookConfig> = { authentication: e.target.value };
        handleConfigUpdate(update);
    }

    function handleResponseCodeChange(e: React.ChangeEvent<HTMLSelectElement>): void {
        // Value comes from controlled select with RESPONSE_CODES options
        const update: Partial<WebhookConfig> = { responseCode: parseInt(e.target.value, 10) };
        handleConfigUpdate(update);
    }

    function handleResponseDataChange(e: React.ChangeEvent<HTMLSelectElement>): void {
        // Value comes from controlled select with RESPONSE_DATA_OPTIONS
        const update: Partial<WebhookConfig> = { responseData: e.target.value };
        handleConfigUpdate(update);
    }

    const handlePathChange = (path: string) => {
        let normalizedPath = path;
        if (path && !path.startsWith('/')) {
            normalizedPath = '/' + path;
        }

        if (normalizedPath && !isValidWebhookPath(normalizedPath)) {
            setPathError('Invalid path format. Use alphanumeric characters, hyphens, underscores, and route parameters (e.g., /:id)');
        } else {
            setPathError(null);
        }

        handleConfigUpdate({ path: normalizedPath });
    };

    const handleSave = () => {
        if (pathError) return;
        onConfigChange(localConfig);
        onClose();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const webhookUrls = getWebhookUrls(localConfig.path);
    const routeParams = parseRouteParams(localConfig.path);

    if (!isOpen) return null;

    return (
        <div className="webhook-config-panel">
            {/* Header */}
            <div className="panel-header">
                <div className="header-title">
                    <span className="header-icon">🔗</span>
                    <h2>Webhook Configuration</h2>
                </div>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            {/* Webhook URL Display */}
            <div className="webhook-url-section">
                <div className="url-toggle">
                    <button
                        className={`toggle-btn ${urlMode === 'test' ? 'active' : ''}`}
                        onClick={() => setUrlMode('test')}
                    >
                        Test URL
                    </button>
                    <button
                        className={`toggle-btn ${urlMode === 'production' ? 'active' : ''}`}
                        onClick={() => setUrlMode('production')}
                    >
                        Production URL
                    </button>
                </div>
                <div className="url-display">
                    <input
                        type="text"
                        value={urlMode === 'test' ? webhookUrls.testUrl : webhookUrls.productionUrl}
                        readOnly
                    />
                    <button
                        className="copy-url-btn"
                        onClick={() => copyToClipboard(urlMode === 'test' ? webhookUrls.testUrl : webhookUrls.productionUrl)}
                        title="Copy URL"
                    >
                        📋
                    </button>
                </div>
                <p className="url-hint">
                    {urlMode === 'test'
                        ? 'Use this URL for testing. n8n shows received data in the editor.'
                        : 'Use this URL in production. Workflow must be active.'}
                </p>
            </div>

            {/* Tabs */}
            <div className="config-tabs">
                <button
                    className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
                    onClick={() => setActiveTab('basic')}
                >
                    Basic
                </button>
                <button
                    className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
                    onClick={() => setActiveTab('auth')}
                >
                    Authentication
                </button>
                <button
                    className={`tab-btn ${activeTab === 'response' ? 'active' : ''}`}
                    onClick={() => setActiveTab('response')}
                >
                    Response
                </button>
                <button
                    className={`tab-btn ${activeTab === 'options' ? 'active' : ''}`}
                    onClick={() => setActiveTab('options')}
                >
                    Options
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Basic Tab */}
                {activeTab === 'basic' && (
                    <div className="config-section">
                        <div className="form-group">
                            <label>HTTP Method</label>
                            <div className="method-buttons">
                                {HTTP_METHODS.map((method) => (
                                    <button
                                        key={method}
                                        className={`method-btn ${localConfig.httpMethod === method ? 'active' : ''}`}
                                        onClick={() => handleConfigUpdate({ httpMethod: method })}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Path</label>
                            <input
                                type="text"
                                value={localConfig.path}
                                onChange={(e) => handlePathChange(e.target.value)}
                                placeholder="/my-webhook"
                                className={pathError ? 'error' : ''}
                            />
                            {pathError && <span className="error-text">{pathError}</span>}
                            <p className="field-hint">
                                Supports route parameters like /:variable or /path/:id
                            </p>
                        </div>

                        {routeParams.length > 0 && (
                            <div className="route-params-info">
                                <label>Route Parameters Detected:</label>
                                <div className="params-list">
                                    {routeParams.map((param) => (
                                        <span key={param} className="param-badge">:{param}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Authentication Tab */}
                {activeTab === 'auth' && (
                    <div className="config-section">
                        <div className="form-group">
                            <label>Authentication</label>
                            <select
                                value={localConfig.authentication}
                                onChange={handleAuthChange}
                            >
                                {AUTH_TYPES.map((auth) => (
                                    <option key={auth.value} value={auth.value}>{auth.label}</option>
                                ))}
                            </select>
                        </div>

                        {localConfig.authentication === 'basicAuth' && (
                            <div className="auth-credentials">
                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        value={localConfig.basicAuthCredentials?.username || ''}
                                        onChange={(e) => handleConfigUpdate({
                                            basicAuthCredentials: {
                                                ...localConfig.basicAuthCredentials,
                                                username: e.target.value,
                                                password: localConfig.basicAuthCredentials?.password || '',
                                            },
                                        })}
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={localConfig.basicAuthCredentials?.password || ''}
                                        onChange={(e) => handleConfigUpdate({
                                            basicAuthCredentials: {
                                                ...localConfig.basicAuthCredentials,
                                                username: localConfig.basicAuthCredentials?.username || '',
                                                password: e.target.value,
                                            },
                                        })}
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>
                        )}

                        {localConfig.authentication === 'headerAuth' && (
                            <div className="auth-credentials">
                                <div className="form-group">
                                    <label>Header Name</label>
                                    <input
                                        type="text"
                                        value={localConfig.headerAuthCredentials?.headerName || ''}
                                        onChange={(e) => handleConfigUpdate({
                                            headerAuthCredentials: {
                                                ...localConfig.headerAuthCredentials,
                                                headerName: e.target.value,
                                                headerValue: localConfig.headerAuthCredentials?.headerValue || '',
                                            },
                                        })}
                                        placeholder="X-API-Key"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Header Value</label>
                                    <input
                                        type="password"
                                        value={localConfig.headerAuthCredentials?.headerValue || ''}
                                        onChange={(e) => handleConfigUpdate({
                                            headerAuthCredentials: {
                                                ...localConfig.headerAuthCredentials,
                                                headerName: localConfig.headerAuthCredentials?.headerName || '',
                                                headerValue: e.target.value,
                                            },
                                        })}
                                        placeholder="Your secret key"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Response Tab */}
                {activeTab === 'response' && (
                    <div className="config-section">
                        <div className="form-group">
                            <label>Respond</label>
                            <div className="response-mode-options">
                                {RESPONSE_MODES.map((mode) => (
                                    <label key={mode.value} className="radio-option">
                                        <input
                                            type="radio"
                                            name="responseMode"
                                            value={mode.value}
                                            checked={localConfig.responseMode === mode.value}
                                            onChange={() => handleConfigUpdate({ responseMode: mode.value })}
                                        />
                                        <div className="radio-content">
                                            <span className="radio-label">{mode.label}</span>
                                            <span className="radio-description">{mode.description}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Response Code</label>
                            <select
                                value={localConfig.responseCode}
                                onChange={handleResponseCodeChange}
                            >
                                {RESPONSE_CODES.map((code) => (
                                    <option key={code} value={code}>{code}</option>
                                ))}
                            </select>
                        </div>

                        {localConfig.responseMode === 'lastNode' && (
                            <div className="form-group">
                                <label>Response Data</label>
                                <select
                                    value={localConfig.responseData}
                                    onChange={handleResponseDataChange}
                                >
                                    {RESPONSE_DATA_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Options Tab */}
                {activeTab === 'options' && (
                    <div className="config-section">
                        <div className="form-group">
                            <label>Allowed Origins (CORS)</label>
                            <input
                                type="text"
                                value={localConfig.options.allowedOrigins || '*'}
                                onChange={(e) => handleOptionsUpdate({ allowedOrigins: e.target.value })}
                                placeholder="* or comma-separated URLs"
                            />
                            <p className="field-hint">Use * to allow all origins, or specify comma-separated URLs</p>
                        </div>

                        <div className="form-group">
                            <label>IP Whitelist</label>
                            <input
                                type="text"
                                value={localConfig.options.ipWhitelist || ''}
                                onChange={(e) => handleOptionsUpdate({ ipWhitelist: e.target.value })}
                                placeholder="192.168.1.1, 10.0.0.0/8"
                            />
                            <p className="field-hint">Comma-separated IP addresses or CIDR ranges. Leave empty to allow all.</p>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={localConfig.options.ignoreBots || false}
                                    onChange={(e) => handleOptionsUpdate({ ignoreBots: e.target.checked })}
                                />
                                <span>Ignore Bots</span>
                            </label>
                            <p className="field-hint">Ignore requests from bots like link previewers and web crawlers</p>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={localConfig.options.rawBody || false}
                                    onChange={(e) => handleOptionsUpdate({ rawBody: e.target.checked })}
                                />
                                <span>Raw Body</span>
                            </label>
                            <p className="field-hint">Receive raw body data (useful for JSON/XML payloads)</p>
                        </div>

                        {(localConfig.httpMethod === 'POST' ||
                            localConfig.httpMethod === 'PUT' ||
                            localConfig.httpMethod === 'PATCH') && (
                                <div className="form-group">
                                    <label>Binary Property</label>
                                    <input
                                        type="text"
                                        value={localConfig.options.binaryPropertyName || ''}
                                        onChange={(e) => handleOptionsUpdate({ binaryPropertyName: e.target.value })}
                                        placeholder="data"
                                    />
                                    <p className="field-hint">Name of the property to write binary file data to</p>
                                </div>
                            )}

                        <div className="form-group">
                            <label>Response Content-Type</label>
                            <select
                                value={localConfig.options.responseContentType || 'application/json'}
                                onChange={(e) => handleOptionsUpdate({ responseContentType: e.target.value })}
                            >
                                <option value="application/json">application/json</option>
                                <option value="text/html">text/html</option>
                                <option value="text/plain">text/plain</option>
                                <option value="application/xml">application/xml</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="panel-footer">
                <button className="cancel-btn" onClick={onClose}>Close</button>
                <button className="save-btn" onClick={handleSave} disabled={!!pathError}>
                    Apply Changes
                </button>
            </div>
        </div>
    );
};

export default WebhookConfigPanel;
