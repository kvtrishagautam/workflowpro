import React, { useState, useEffect } from 'react';
import { NodeProps } from '../types';
import './NodeConfigPanel.css';

interface NodeConfigPanelProps {
    node: NodeProps | null;
    onUpdate: (nodeId: string, config: any) => void;
    onClose: () => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onUpdate, onClose }) => {
    const [config, setConfig] = useState<any>({});

    useEffect(() => {
        if (node) {
            setConfig(node.data.config || {});
        }
    }, [node]);

    if (!node) return null;

    const handleSave = () => {
        onUpdate(node.id, config);
        onClose();
    };

    const renderConfigFields = () => {
        switch (node.type) {
            case 'slack':
                return (
                    <>
                        <div className="config-field">
                            <label>Channel</label>
                            <input
                                type="text"
                                placeholder="#general"
                                value={config.channel || ''}
                                onChange={(e) => setConfig({ ...config, channel: e.target.value })}
                            />
                            <small>Channel name or ID (e.g., #general or C01234567)</small>
                        </div>
                        <div className="config-field">
                            <label>Message</label>
                            <textarea
                                rows={4}
                                placeholder="Enter your message..."
                                value={config.message || ''}
                                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                            />
                            <small>Supports markdown and emojis 🎉</small>
                        </div>
                    </>
                );

            case 'webhook':
                return (
                    <div className="config-field">
                        <label>Webhook URL</label>
                        <input
                            type="url"
                            placeholder="https://example.com/webhook"
                            value={config.url || ''}
                            onChange={(e) => setConfig({ ...config, url: e.target.value })}
                        />
                    </div>
                );

            case 'http':
                return (
                    <>
                        <div className="config-field">
                            <label>URL</label>
                            <input
                                type="url"
                                placeholder="https://api.example.com/endpoint"
                                value={config.url || ''}
                                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                            />
                        </div>
                        <div className="config-field">
                            <label>Method</label>
                            <select
                                value={config.method || 'GET'}
                                onChange={(e) => setConfig({ ...config, method: e.target.value })}
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                            </select>
                        </div>
                    </>
                );

            case 'javascript':
                return (
                    <div className="config-field">
                        <label>JavaScript Code</label>
                        <textarea
                            rows={8}
                            placeholder="// Your code here\nreturn { result: 'success' };"
                            value={config.code || ''}
                            onChange={(e) => setConfig({ ...config, code: e.target.value })}
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                );

            case 'conditional':
                return (
                    <div className="config-field">
                        <label>Condition</label>
                        <input
                            type="text"
                            placeholder="data.value > 100"
                            value={config.condition || ''}
                            onChange={(e) => setConfig({ ...config, condition: e.target.value })}
                        />
                        <small>JavaScript expression that returns true/false</small>
                    </div>
                );

            case 'delay':
                return (
                    <div className="config-field">
                        <label>Delay (milliseconds)</label>
                        <input
                            type="number"
                            placeholder="1000"
                            value={config.duration || ''}
                            onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) })}
                        />
                        <small>1000ms = 1 second</small>
                    </div>
                );

            default:
                return <p>No configuration available for this node type.</p>;
        }
    };

    return (
        <div className="node-config-panel">
            <div className="config-header">
                <h3>Configure {node.type} Node</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="config-body">
                <div className="config-field">
                    <label>Node Label</label>
                    <input
                        type="text"
                        value={node.data.label}
                        onChange={(e) => {
                            const updatedNode = {
                                ...node,
                                data: { ...node.data, label: e.target.value }
                            };
                            onUpdate(node.id, config);
                        }}
                    />
                </div>

                {renderConfigFields()}
            </div>

            <div className="config-footer">
                <button className="cancel-btn" onClick={onClose}>Cancel</button>
                <button className="save-btn" onClick={handleSave}>Save Configuration</button>
            </div>
        </div>
    );
};

export default NodeConfigPanel;
