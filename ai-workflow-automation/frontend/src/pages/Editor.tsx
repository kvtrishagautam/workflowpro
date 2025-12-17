import React, { useState } from 'react';
import Canvas from '../components/Canvas';
import NodePalette from '../components/NodePalette';
import { Workflow, NodeProps } from '../types';
import './Editor.css';

type NodeType = 'webhook' | 'javascript' | 'slack' | 'http' | 'conditional' | 'delay';

const Editor: React.FC = () => {
    const [workflow, setWorkflow] = useState<Workflow>({
        id: `workflow_${Date.now()}`,
        name: 'New Workflow',
        description: '',
        nodes: [],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    const handleWorkflowChange = (updatedWorkflow: Workflow) => {
        setWorkflow({
            ...updatedWorkflow,
            updatedAt: new Date().toISOString(),
        });
    };

    const handleAddNode = (nodeType: string) => {
        const newNode: any = {
            id: `node_${Date.now()}`,
            type: nodeType,
            data: {
                label: `${nodeType} Node`,
                config: {},
            },
            position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
        };

        setWorkflow({
            ...workflow,
            nodes: [...workflow.nodes, newNode],
            updatedAt: new Date().toISOString(),
        });
    };

    const handleSaveWorkflow = async () => {
        setIsSaving(true);
        try {
            // TODO: Replace with actual API call
            console.log('Saving workflow:', workflow);

            // Simulated API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setLastSaved(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Failed to save workflow:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleWorkflowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWorkflow({
            ...workflow,
            name: e.target.value,
        });
    };

    const handleWorkflowDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setWorkflow({
            ...workflow,
            description: e.target.value,
        });
    };

    return (
        <div className="editor">
            {/* Header */}
            <div className="editor-header">
                <div className="editor-title-section">
                    <input
                        type="text"
                        className="editor-title-input"
                        value={workflow.name}
                        onChange={handleWorkflowNameChange}
                        placeholder="Workflow name"
                    />
                    <textarea
                        className="editor-description-input"
                        value={workflow.description}
                        onChange={handleWorkflowDescriptionChange}
                        placeholder="Add a description..."
                        rows={2}
                    />
                </div>

                <div className="editor-header-actions">
                    <div className="workflow-stats">
                        <span title={`Nodes: ${workflow.nodes.length}`}>🔧 {workflow.nodes.length}</span>
                        <span title={`Connections: ${workflow.edges.length}`}>🔗 {workflow.edges.length}</span>
                        {lastSaved && <span className="last-saved">Last saved: {lastSaved}</span>}
                    </div>

                    <button
                        className={`save-button ${isSaving ? 'saving' : ''}`}
                        onClick={handleSaveWorkflow}
                        disabled={isSaving}
                    >
                        {isSaving ? '💾 Saving...' : '💾 Save'}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="editor-container">
                {/* Node Palette */}
                <NodePalette onAddNode={handleAddNode} />

                {/* Canvas */}
                <Canvas workflow={workflow} onWorkflowChange={handleWorkflowChange} />

                {/* Properties Panel (Right Sidebar) */}
                <div className="editor-properties">
                    <div className="properties-header">
                        <h3>Properties</h3>
                    </div>

                    <div className="properties-content">
                        {workflow.nodes.length === 0 ? (
                            <div className="empty-properties">
                                <p>No nodes selected</p>
                                <p style={{ fontSize: '12px', color: '#64748b' }}>
                                    Add nodes from the palette to get started
                                </p>
                            </div>
                        ) : (
                            <div className="properties-stats">
                                <div className="stat-item">
                                    <label>Total Nodes</label>
                                    <div className="stat-value">{workflow.nodes.length}</div>
                                </div>
                                <div className="stat-item">
                                    <label>Total Connections</label>
                                    <div className="stat-value">{workflow.edges.length}</div>
                                </div>
                                <div className="stat-item">
                                    <label>Last Updated</label>
                                    <div className="stat-value" style={{ fontSize: '11px' }}>
                                        {new Date(workflow.updatedAt || new Date()).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;