import React, { useState } from 'react';
import { NodeProps, NODE_TYPES } from '../types';
import { WebhookConfig, DEFAULT_WEBHOOK_CONFIG, getWebhookUrls } from '../types/nodes/webhook';
import './WorkflowNode.css';

interface WorkflowNodeComponentProps {
    node: NodeProps;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onConnectorMouseDown: (e: React.MouseEvent, nodeId: string, connectorType: 'input' | 'output') => void;
    onConnectorMouseUp: (e: React.MouseEvent, nodeId: string, connectorType: 'input' | 'output') => void;
    onUpdate?: (nodeId: string, updatedNode: NodeProps) => void;
    onOpenWebhookConfig?: (node: NodeProps) => void;
    onOpenNodeConfig?: (node: NodeProps) => void;
}

const NodeIcons: Record<string, string> = {
    [NODE_TYPES.WEBHOOK]: '🔗',
    [NODE_TYPES.SCHEDULE]: '⏰',
    [NODE_TYPES.JAVASCRIPT]: '📝',
    [NODE_TYPES.SLACK]: '💬',
    [NODE_TYPES.HTTP]: '🌐',
    [NODE_TYPES.CONDITIONAL]: '🔀',
    [NODE_TYPES.DELAY]: '⏱️',
    [NODE_TYPES.SET]: '✏️',
    [NODE_TYPES.FILTER]: '🔍',
    [NODE_TYPES.MERGE]: '🔗',
    [NODE_TYPES.SPLIT_BATCHES]: '📦',
    [NODE_TYPES.EMAIL]: '📧',
    [NODE_TYPES.WHATSAPP]: '📱',
    [NODE_TYPES.TELEGRAM]: '✈️',
    [NODE_TYPES.DISCORD]: '🎮',
    [NODE_TYPES.GOOGLE_SHEETS]: '📊',
    [NODE_TYPES.AIRTABLE]: '📋',
    [NODE_TYPES.NOTION]: '📓',
    [NODE_TYPES.MYSQL]: '🗄️',
    [NODE_TYPES.POSTGRES]: '🐘',
    [NODE_TYPES.OPENAI]: '🤖',
};

const NodeColors: Record<string, string> = {
    [NODE_TYPES.WEBHOOK]: '#60A5FA',
    [NODE_TYPES.SCHEDULE]: '#818CF8',
    [NODE_TYPES.JAVASCRIPT]: '#A78BFA',
    [NODE_TYPES.SLACK]: '#4A154B',
    [NODE_TYPES.HTTP]: '#FBBF24',
    [NODE_TYPES.CONDITIONAL]: '#F87171',
    [NODE_TYPES.DELAY]: '#94A3B8',
    [NODE_TYPES.SET]: '#FB923C',
    [NODE_TYPES.FILTER]: '#FACC15',
    [NODE_TYPES.MERGE]: '#4ADE80',
    [NODE_TYPES.SPLIT_BATCHES]: '#2DD4BF',
    [NODE_TYPES.EMAIL]: '#EA4335',
    [NODE_TYPES.WHATSAPP]: '#25D366',
    [NODE_TYPES.TELEGRAM]: '#0088CC',
    [NODE_TYPES.DISCORD]: '#5865F2',
    [NODE_TYPES.GOOGLE_SHEETS]: '#34A853',
    [NODE_TYPES.AIRTABLE]: '#18BFFF',
    [NODE_TYPES.NOTION]: '#000000',
    [NODE_TYPES.MYSQL]: '#00758F',
    [NODE_TYPES.POSTGRES]: '#336791',
    [NODE_TYPES.OPENAI]: '#10A37F',
};

const NodeLabels: Record<string, string> = {
    [NODE_TYPES.WEBHOOK]: 'Webhook',
    [NODE_TYPES.SCHEDULE]: 'Schedule',
    [NODE_TYPES.JAVASCRIPT]: 'Code',
    [NODE_TYPES.SLACK]: 'Slack',
    [NODE_TYPES.HTTP]: 'HTTP Request',
    [NODE_TYPES.CONDITIONAL]: 'IF',
    [NODE_TYPES.DELAY]: 'Delay',
    [NODE_TYPES.SET]: 'Set',
    [NODE_TYPES.FILTER]: 'Filter',
    [NODE_TYPES.MERGE]: 'Merge',
    [NODE_TYPES.SPLIT_BATCHES]: 'Split Batches',
    [NODE_TYPES.EMAIL]: 'Email',
    [NODE_TYPES.WHATSAPP]: 'WhatsApp',
    [NODE_TYPES.TELEGRAM]: 'Telegram',
    [NODE_TYPES.DISCORD]: 'Discord',
    [NODE_TYPES.GOOGLE_SHEETS]: 'Google Sheets',
    [NODE_TYPES.AIRTABLE]: 'Airtable',
    [NODE_TYPES.NOTION]: 'Notion',
    [NODE_TYPES.MYSQL]: 'MySQL',
    [NODE_TYPES.POSTGRES]: 'PostgreSQL',
    [NODE_TYPES.OPENAI]: 'OpenAI',
};

const WorkflowNode: React.FC<WorkflowNodeComponentProps> = ({
    node,
    isSelected,
    onSelect,
    onDelete,
    onMouseDown,
    onConnectorMouseDown,
    onConnectorMouseUp,
    onUpdate,
    onOpenWebhookConfig,
    onOpenNodeConfig,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const icon = NodeIcons[node.type] || '📦';
    const color = NodeColors[node.type] || '#6B7280';
    const label = NodeLabels[node.type] || node.type;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Webhook URL copied to clipboard!');
    };

    // Get webhook config from node data or use defaults
    const getWebhookConfig = (): Partial<WebhookConfig> => {
        const config = node.data.config || {};
        return {
            path: config.path || DEFAULT_WEBHOOK_CONFIG.path,
            httpMethod: config.httpMethod || config.method || DEFAULT_WEBHOOK_CONFIG.httpMethod,
            authentication: config.authentication || DEFAULT_WEBHOOK_CONFIG.authentication,
            responseMode: config.responseMode || DEFAULT_WEBHOOK_CONFIG.responseMode,
            responseCode: config.responseCode || DEFAULT_WEBHOOK_CONFIG.responseCode,
            responseData: config.responseData || DEFAULT_WEBHOOK_CONFIG.responseData,
            basicAuthCredentials: config.basicAuthCredentials,
            headerAuthCredentials: config.headerAuthCredentials,
            options: config.options || DEFAULT_WEBHOOK_CONFIG.options,
        };
    };

    // Get webhook URLs for display
    const webhookConfig = getWebhookConfig();
    const webhookUrls = getWebhookUrls(webhookConfig.path || '/');

    // Handle opening webhook config panel
    const handleOpenWebhookPanel = () => {
        if (onOpenWebhookConfig) {
            onOpenWebhookConfig(node);
        }
    };

    // Handle opening generic node config panel
    const handleOpenNodeConfig = () => {
        if (onOpenNodeConfig) {
            onOpenNodeConfig(node);
        } else if (node.type === 'webhook' && onOpenWebhookConfig) {
            onOpenWebhookConfig(node);
        }
    };

    // Get a summary of node config for display
    const getConfigSummary = (): { label: string; value: string }[] => {
        const config = node.data.config || {};
        const summary: { label: string; value: string }[] = [];

        switch (node.type) {
            case NODE_TYPES.SCHEDULE:
                if (config.interval) summary.push({ label: 'Interval', value: `${config.interval} ${config.unit || 'minutes'}` });
                if (config.cronExpression) summary.push({ label: 'Cron', value: config.cronExpression });
                break;
            case NODE_TYPES.EMAIL:
                if (config.to) summary.push({ label: 'To', value: config.to.substring(0, 25) });
                if (config.subject) summary.push({ label: 'Subject', value: config.subject.substring(0, 20) });
                break;
            case NODE_TYPES.WHATSAPP:
            case NODE_TYPES.TELEGRAM:
                if (config.to) summary.push({ label: 'To', value: config.to.substring(0, 20) });
                if (config.message) summary.push({ label: 'Message', value: config.message.substring(0, 20) + '...' });
                break;
            case NODE_TYPES.HTTP:
                if (config.method) summary.push({ label: 'Method', value: config.method });
                if (config.url) summary.push({ label: 'URL', value: config.url.substring(0, 25) });
                break;
            case NODE_TYPES.OPENAI:
                if (config.model) summary.push({ label: 'Model', value: config.model });
                if (config.operation) summary.push({ label: 'Operation', value: config.operation });
                break;
            case NODE_TYPES.GOOGLE_SHEETS:
            case NODE_TYPES.AIRTABLE:
            case NODE_TYPES.NOTION:
                if (config.operation) summary.push({ label: 'Operation', value: config.operation });
                break;
            case NODE_TYPES.MYSQL:
            case NODE_TYPES.POSTGRES:
                if (config.operation) summary.push({ label: 'Operation', value: config.operation });
                if (config.table) summary.push({ label: 'Table', value: config.table });
                break;
            case NODE_TYPES.CONDITIONAL:
                if (config.conditions?.length) summary.push({ label: 'Conditions', value: `${config.conditions.length} rule(s)` });
                break;
            case NODE_TYPES.SET:
                if (config.fields?.length) summary.push({ label: 'Fields', value: `${config.fields.length} field(s)` });
                break;
            case NODE_TYPES.FILTER:
                if (config.conditions?.length) summary.push({ label: 'Filters', value: `${config.conditions.length} condition(s)` });
                break;
            default:
                // Show first 2 config items
                Object.entries(config).slice(0, 2).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        summary.push({ label: key, value: String(value).substring(0, 20) });
                    }
                });
        }
        return summary;
    };

    return (
        <div
            className={`workflow-node ${isSelected ? 'selected' : ''}`}
            data-node-id={node.id}
            style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                borderColor: color,
            }}
            onClick={() => onSelect(node.id)}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onDoubleClick={(e) => {
                e.stopPropagation();
                handleOpenNodeConfig();
            }}
        >
            {/* Node Header */}
            <div className="node-header" style={{ backgroundColor: color }}>
                <span className="node-icon">{icon}</span>
                <span className="node-type">{label}</span>
                <button
                    className="node-menu-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                >
                    ⋮
                </button>
            </div>

            {/* Node Content */}
            <div className="node-content">
                <p className="node-label">{node.data.label || `${label} Node`}</p>
                {/* Webhook Node Config UI - Simplified with Configure Button */}
                {node.type === 'webhook' && (
                    <div className="node-config webhook-config-preview">
                        <div className="webhook-summary">
                            <div className="webhook-method-badge" data-method={webhookConfig.httpMethod}>
                                {webhookConfig.httpMethod || 'POST'}
                            </div>
                            <span className="webhook-path-preview">{webhookConfig.path || '/webhook'}</span>
                        </div>

                        <div className="webhook-quick-info">
                            {webhookConfig.authentication !== 'none' && (
                                <span className="info-badge auth">🔐 Auth</span>
                            )}
                            {webhookConfig.responseMode === 'lastNode' && (
                                <span className="info-badge response">⏳ Wait</span>
                            )}
                            {webhookConfig.options?.ignoreBots && (
                                <span className="info-badge">🤖 No Bots</span>
                            )}
                        </div>

                        <div className="webhook-url-preview">
                            <input
                                type="text"
                                value={webhookUrls.productionUrl}
                                readOnly
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            />
                            <button
                                className="copy-btn-small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(webhookUrls.productionUrl);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                title="Copy URL"
                            >
                                📋
                            </button>
                        </div>

                        <button
                            className="configure-webhook-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWebhookPanel();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ⚙️ Configure Webhook
                        </button>
                    </div>
                )}
                {/* Delay Node Config UI */}
                {node.type === 'delay' && node.data.config && (
                    <div className="node-config">
                        <label>Duration</label>
                        <input
                            type="number"
                            min="1"
                            value={node.data.config.duration || 10}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={e => {
                                if (typeof onUpdate === 'function') {
                                    onUpdate(node.id, {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            config: {
                                                ...node.data.config,
                                                duration: parseInt(e.target.value) || 1,
                                            },
                                        },
                                    });
                                }
                            }}
                        />
                        <label>Unit</label>
                        <select
                            value={node.data.config.unit || 'seconds'}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={e => {
                                if (typeof onUpdate === 'function') {
                                    onUpdate(node.id, {
                                        ...node,
                                        data: {
                                            ...node.data,
                                            config: {
                                                ...node.data.config,
                                                unit: e.target.value,
                                            },
                                        },
                                    });
                                }
                            }}
                        >
                            <option value="seconds">Seconds</option>
                            <option value="minutes">Minutes</option>
                        </select>
                    </div>
                )}
                {/* Generic Node Config Summary */}
                {node.type !== 'webhook' && node.type !== 'delay' && (
                    <div className="node-config-summary">
                        {getConfigSummary().map((item, idx) => (
                            <div key={idx} className="config-summary-item">
                                <span className="config-summary-label">{item.label}:</span>
                                <span className="config-summary-value">{item.value}</span>
                            </div>
                        ))}
                        <button
                            className="configure-node-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOpenNodeConfig();
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            ⚙️ Configure
                        </button>
                    </div>
                )}
            </div>

            {/* Connection Points */}
            <div
                className="node-connector input-connector"
                title="Input"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onConnectorMouseDown(e, node.id, 'input');
                }}
                onMouseUp={(e) => {
                    e.stopPropagation();
                    onConnectorMouseUp(e, node.id, 'input');
                }}
            />
            <div
                className="node-connector output-connector"
                title="Output"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onConnectorMouseDown(e, node.id, 'output');
                }}
                onMouseUp={(e) => {
                    e.stopPropagation();
                    onConnectorMouseUp(e, node.id, 'output');
                }}
            />

            {/* Context Menu */}
            {showMenu && (
                <div className="node-menu">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(node.id);
                            setShowMenu(false);
                        }}
                        className="menu-item delete"
                    >
                        🗑️ Delete
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenNodeConfig();
                            setShowMenu(false);
                        }}
                        className="menu-item"
                    >
                        ⚙️ Configure
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkflowNode;
