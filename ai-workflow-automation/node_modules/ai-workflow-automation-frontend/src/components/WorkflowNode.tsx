import React, { useState } from 'react';
import { NodeProps } from '../types';
import './WorkflowNode.css';

interface WorkflowNodeComponentProps {
    node: NodeProps;
    isSelected: boolean;
    onSelect: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onDragStart: (e: React.DragEvent, nodeId: string) => void;
}

const NodeIcons: Record<string, string> = {
    webhook: '🔗',
    javascript: '📝',
    slack: '💬',
    http: '🌐',
    conditional: '🔀',
    delay: '⏱️',
};

const NodeColors: Record<string, string> = {
    webhook: '#60A5FA',
    javascript: '#A78BFA',
    slack: '#34D399',
    http: '#FBBF24',
    conditional: '#F87171',
    delay: '#94A3B8',
};

const WorkflowNode: React.FC<WorkflowNodeComponentProps> = ({
    node,
    isSelected,
    onSelect,
    onDelete,
    onDragStart,
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
            onDragStart={(e) => onDragStart(e, node.id)}
            draggable
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
            <div className="node-connector input-connector" title="Input" />
            <div className="node-connector output-connector" title="Output" />

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
