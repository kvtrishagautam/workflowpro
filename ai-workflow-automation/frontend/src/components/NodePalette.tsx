import React, { useState } from 'react';
import { NODE_TYPES, NodeCategory } from '../types';
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
    category: NodeCategory;
}

const nodeOptions: NodeOption[] = [
    // ===== TRIGGERS =====
    {
        type: NODE_TYPES.WEBHOOK,
        icon: '🔗',
        label: 'Webhook',
        description: 'Trigger from external HTTP request',
        color: '#60A5FA',
        category: 'triggers',
    },
    {
        type: NODE_TYPES.SCHEDULE,
        icon: '⏰',
        label: 'Schedule',
        description: 'Trigger on time intervals or cron',
        color: '#818CF8',
        category: 'triggers',
    },

    // ===== LOGIC =====
    {
        type: NODE_TYPES.JAVASCRIPT,
        icon: '📝',
        label: 'Code',
        description: 'Execute custom JavaScript code',
        color: '#A78BFA',
        category: 'logic',
    },
    {
        type: NODE_TYPES.CONDITIONAL,
        icon: '🔀',
        label: 'IF',
        description: 'Branch based on conditions',
        color: '#F87171',
        category: 'logic',
    },
    {
        type: NODE_TYPES.SET,
        icon: '✏️',
        label: 'Set',
        description: 'Set/transform field values',
        color: '#FB923C',
        category: 'logic',
    },
    {
        type: NODE_TYPES.FILTER,
        icon: '🔍',
        label: 'Filter',
        description: 'Filter items by conditions',
        color: '#FACC15',
        category: 'logic',
    },
    {
        type: NODE_TYPES.MERGE,
        icon: '🔗',
        label: 'Merge',
        description: 'Combine data from branches',
        color: '#4ADE80',
        category: 'logic',
    },
    {
        type: NODE_TYPES.SPLIT_BATCHES,
        icon: '📦',
        label: 'Split Batches',
        description: 'Process items in batches',
        color: '#2DD4BF',
        category: 'logic',
    },
    {
        type: NODE_TYPES.DELAY,
        icon: '⏱️',
        label: 'Delay',
        description: 'Wait before continuing',
        color: '#94A3B8',
        category: 'logic',
    },

    // ===== HTTP & API =====
    {
        type: NODE_TYPES.HTTP,
        icon: '🌐',
        label: 'HTTP Request',
        description: 'Make REST API calls',
        color: '#FBBF24',
        category: 'http',
    },

    // ===== COMMUNICATION =====
    {
        type: NODE_TYPES.SLACK,
        icon: '💬',
        label: 'Slack',
        description: 'Send messages to Slack',
        color: '#4A154B',
        category: 'communication',
    },
    {
        type: NODE_TYPES.EMAIL,
        icon: '📧',
        label: 'Email',
        description: 'Send emails via SMTP',
        color: '#EA4335',
        category: 'communication',
    },
    {
        type: NODE_TYPES.WHATSAPP,
        icon: '📱',
        label: 'WhatsApp',
        description: 'Send WhatsApp messages',
        color: '#25D366',
        category: 'communication',
    },
    {
        type: NODE_TYPES.TELEGRAM,
        icon: '✈️',
        label: 'Telegram',
        description: 'Send Telegram messages',
        color: '#0088CC',
        category: 'communication',
    },
    {
        type: NODE_TYPES.DISCORD,
        icon: '🎮',
        label: 'Discord',
        description: 'Send Discord messages',
        color: '#5865F2',
        category: 'communication',
    },

    // ===== DATA & STORAGE =====
    {
        type: NODE_TYPES.GOOGLE_SHEETS,
        icon: '📊',
        label: 'Google Sheets',
        description: 'Read/write spreadsheet data',
        color: '#34A853',
        category: 'data',
    },
    {
        type: NODE_TYPES.AIRTABLE,
        icon: '📋',
        label: 'Airtable',
        description: 'Manage Airtable records',
        color: '#18BFFF',
        category: 'data',
    },
    {
        type: NODE_TYPES.NOTION,
        icon: '📓',
        label: 'Notion',
        description: 'Create/update Notion pages',
        color: '#000000',
        category: 'data',
    },
    {
        type: NODE_TYPES.MYSQL,
        icon: '🗄️',
        label: 'MySQL',
        description: 'Query MySQL database',
        color: '#00758F',
        category: 'data',
    },
    {
        type: NODE_TYPES.POSTGRES,
        icon: '🐘',
        label: 'PostgreSQL',
        description: 'Query PostgreSQL database',
        color: '#336791',
        category: 'data',
    },

    // ===== AI =====
    {
        type: NODE_TYPES.OPENAI,
        icon: '🤖',
        label: 'OpenAI',
        description: 'GPT, DALL-E, embeddings',
        color: '#10A37F',
        category: 'ai',
    },
];

const categoryLabels: Record<NodeCategory, string> = {
    triggers: '⚡ Triggers',
    logic: '🔧 Logic & Flow',
    http: '🌐 HTTP & API',
    communication: '💬 Communication',
    data: '📊 Data & Storage',
    ai: '🤖 AI & ML',
};

const categoryOrder: NodeCategory[] = ['triggers', 'logic', 'http', 'communication', 'data', 'ai'];

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
        new Set(categoryOrder)
    );

    const filteredNodes = searchTerm
        ? nodeOptions.filter(
            (node) =>
                node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                node.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : nodeOptions;

    const initialCategories: Record<NodeCategory, NodeOption[]> = {
        triggers: [],
        logic: [],
        http: [],
        communication: [],
        data: [],
        ai: [],
    };

    const nodesByCategory = categoryOrder.reduce((acc, category) => {
        acc[category] = filteredNodes.filter((node) => node.category === category);
        return acc;
    }, initialCategories);

    const toggleCategory = (category: NodeCategory) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    return (
        <div className="node-palette">
            <div className="palette-header">
                <h3>Nodes</h3>
                <p>Drag or click to add</p>
            </div>

            <div className="palette-search">
                <input
                    type="text"
                    placeholder="🔍 Search nodes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="palette-items">
                {categoryOrder.map((category) => {
                    const nodes = nodesByCategory[category];
                    if (nodes.length === 0) return null;

                    const isExpanded = expandedCategories.has(category);

                    return (
                        <div key={category} className="node-category">
                            <div
                                className="category-header"
                                onClick={() => toggleCategory(category)}
                            >
                                <span className="category-label">{categoryLabels[category]}</span>
                                <span className={`category-arrow ${isExpanded ? 'expanded' : ''}`}>
                                    ▶
                                </span>
                            </div>
                            {isExpanded && (
                                <div className="category-nodes">
                                    {nodes.map((option) => (
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
                                                <div className="item-description">
                                                    {option.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NodePalette;
