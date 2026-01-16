import React, { useState } from 'react';
import { NodeProps } from '../types';
import './WorkflowNode.css';

interface WorkflowNodeComponentProps {
    node: NodeProps;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onDragStart: (e: React.MouseEvent, nodeId: string) => void;
    onConnectStart?: (nodeId: string) => void;
    onConnectEnd?: (nodeId: string) => void;
}

const NodeIcons: Record<string, string> = {
    webhook: '🔗',
    javascript: '📝',
    slack: '💬',
    http: '🌐',
    conditional: '🔀',
    delay: '⏱️',
    emailDiscovery: '🔍',
    emailSending: '✉️',
};

const NodeColors: Record<string, string> = {
    webhook: '#60A5FA',
    javascript: '#A78BFA',
    slack: '#34D399',
    http: '#FBBF24',
    conditional: '#F87171',
    delay: '#94A3B8',
    emailDiscovery: '#EC4899',
    emailSending: '#10B981',
};

const WorkflowNode: React.FC<WorkflowNodeComponentProps> = ({
    node,
    isSelected,
    onSelect,
    onDelete,
    onDragStart,
    onConnectStart,
    onConnectEnd,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const icon = NodeIcons[node.type] || '📦';
    const color = NodeColors[node.type] || '#6B7280';

    return (
        <div
            className={`workflow-node ${isSelected ? 'selected' : ''}`}
            style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                borderColor: color,
            }}
            onClick={() => onSelect(node.id)}
            onMouseDown={(e) => {
                // Only start drag if not clicking on a connector
                const target = e.target;
                if (target instanceof HTMLElement && !target.classList.contains('node-connector')) {
                    onDragStart(e, node.id);
                }
            }}
        >
            {/* Node Header */}
            <div className="node-header" style={{ backgroundColor: color }}>
                <span className="node-icon">{icon}</span>
                <span className="node-type">{node.type}</span>
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
                <p className="node-label">{node.data.label || `${node.type} Node`}</p>
                {node.data.config && (
                    <div className="node-config">
                        {Object.entries(node.data.config)
                            .slice(0, 2)
                            .map(([key, value]) => (
                                <small key={key} className="config-item">
                                    {key}: {String(value).substring(0, 20)}
                                </small>
                            ))}
                    </div>
                )}
            </div>

            {/* Connection Points */}
            <div
                className="node-connector input-connector"
                title="Input"
                onMouseUp={(e) => {
                    e.stopPropagation();
                    onConnectEnd?.(node.id);
                }}
            />
            <div
                className="node-connector output-connector"
                title="Output"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onConnectStart?.(node.id);
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
                            setShowMenu(false);
                        }}
                        className="menu-item"
                    >
                        ⚙️ Edit
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkflowNode;
