import React from 'react';
import { NODE_TYPES } from '../types';
import './NodePalette.css';

interface NodePaletteProps {
    onAddNode: (nodeType: string) => void;
}

interface NodeOption {
    type: string;
    icon: string;
    label: string;
    description: string;
    color: string;
}

const nodeOptions: NodeOption[] = [
    {
        type: NODE_TYPES.WEBHOOK,
        icon: '🔗',
        label: 'Webhook',
        description: 'Trigger workflow from external event',
        color: '#60A5FA',
    },
    {
        type: NODE_TYPES.JAVASCRIPT,
        icon: '📝',
        label: 'JavaScript',
        description: 'Execute custom code',
        color: '#A78BFA',
    },
    {
        type: NODE_TYPES.SLACK,
        icon: '💬',
        label: 'Slack',
        description: 'Send message to Slack',
        color: '#34D399',
    },
    {
        type: NODE_TYPES.HTTP,
        icon: '🌐',
        label: 'HTTP Request',
        description: 'Make HTTP/REST call',
        color: '#FBBF24',
    },
    {
        type: NODE_TYPES.CONDITIONAL,
        icon: '🔀',
        label: 'Conditional',
        description: 'Branch based on condition',
        color: '#F87171',
    },
    {
        type: NODE_TYPES.DELAY,
        icon: '⏱️',
        label: 'Delay',
        description: 'Wait before next step',
        color: '#94A3B8',
    },
];

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
    return (
        <div className="node-palette">
            <div className="palette-header">
                <h3>Nodes</h3>
                <p>Drag or click to add</p>
            </div>

            <div className="palette-items">
                {nodeOptions.map((option) => (
                    <div
                        key={option.type}
                        className="palette-item"
                        style={{ borderLeftColor: option.color }}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer?.setData('nodeType', option.type);
                        }}
                        onClick={() => onAddNode(option.type)}
                        title={option.description}
                    >
                        <div className="item-icon">{option.icon}</div>
                        <div className="item-info">
                            <div className="item-label">{option.label}</div>
                            <div className="item-description">{option.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NodePalette;
