import React, { useState, useEffect } from 'react';
import Canvas from '../components/Canvas';
import NodePalette from '../components/NodePalette';
import NodeConfigPanel from '../components/NodeConfigPanel';
import { Workflow, NodeProps } from '../types';
import './Editor.css';
import { workflowAPI } from '../services/api';

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
    const [workflowId, setWorkflowId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<NodeProps | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executeResult, setExecuteResult] = useState<any>(null);

    // Load workflows on mount
    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const response = await workflowAPI.list();
            const workflows = response.data.workflows;
            if (workflows && workflows.length > 0) {
                const firstWorkflow = workflows[0];
                setWorkflow({
                    id: firstWorkflow._id,
                    name: firstWorkflow.name,
                    description: firstWorkflow.description || '',
                    nodes: firstWorkflow.nodes || [],
                    edges: firstWorkflow.edges || [],
                    createdAt: firstWorkflow.createdAt,
                    updatedAt: firstWorkflow.updatedAt,
                });
                setWorkflowId(firstWorkflow._id);
            }
        } catch (error) {
            console.error('Failed to load workflows:', error);
        }
    };

    const handleWorkflowChange = (updatedWorkflow: Workflow) => {
        setWorkflow({
            ...updatedWorkflow,
            updatedAt: new Date().toISOString(),
        });
        // Update selected node if it changed
        if (selectedNode) {
            const updatedNode = updatedWorkflow.nodes.find(n => n.id === selectedNode.id);
            setSelectedNode(updatedNode || null);
        }
    };

    const handleNodeSelect = (nodeId: string) => {
        const node = workflow.nodes.find(n => n.id === nodeId);
        setSelectedNode(node || null);
    };

    const handleNodeConfigUpdate = (nodeId: string, config: any) => {
        const updatedNodes = workflow.nodes.map(node =>
            node.id === nodeId
                ? { ...node, data: { ...node.data, config } }
                : node
        );
        setWorkflow({
            ...workflow,
            nodes: updatedNodes,
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
        setSaveError(null);
        try {
            let response;
            if (workflowId) {
                // Update existing workflow
                response = await workflowAPI.update(workflowId, workflow);
            } else {
                // Create new workflow
                response = await workflowAPI.create(workflow);
                setWorkflowId(response.data.workflow._id);
            }
            setLastSaved(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Failed to save workflow:', error);
            setSaveError('Failed to save workflow');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExecuteWorkflow = async () => {
        if (!workflowId) {
            alert('Please save the workflow first!');
            return;
        }

        setIsExecuting(true);
        setExecuteResult(null);
        try {
            const response = await workflowAPI.execute(workflowId);
            setExecuteResult(response.data);
            alert('✅ Workflow executed successfully! Check Slack for the message.');
        } catch (error) {
            console.error('Failed to execute workflow:', error);
            alert('❌ Execution failed. Check console for details.');
        } finally {
            setIsExecuting(false);
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

                    <button
                        className={`execute-button ${isExecuting ? 'executing' : ''}`}
                        onClick={handleExecuteWorkflow}
                        disabled={isExecuting || !workflowId}
                        title={!workflowId ? 'Save workflow first' : 'Execute workflow'}
                    >
                        {isExecuting ? '⚡ Executing...' : '⚡ Execute'}
                    </button>
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="editor-container">
                {/* Node Palette */}
                <NodePalette onAddNode={handleAddNode} />

                {/* Canvas */}
                <Canvas
                    workflow={workflow}
                    onWorkflowChange={handleWorkflowChange}
                    onNodeSelect={handleNodeSelect}
                />

                {/* Properties Panel (Right Sidebar) */}
                <div className="editor-properties">
                    <div className="properties-header">
                        <h3>Properties</h3>
                    </div>

                    <div className="properties-content">
                        {workflow.nodes.length === 0 ? (
                            <div className="empty-properties">
                                <p>No nodes in workflow</p>
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

                                {/* Node Type Breakdown */}
                                <div className="stat-item">
                                    <label>Node Types</label>
                                    <div className="node-types">
                                        {(() => {
                                            const nodeTypeCounts: Record<string, number> = {};
                                            workflow.nodes.forEach((node) => {
                                                nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
                                            });
                                            return Object.entries(nodeTypeCounts).map(([type, count]) => (
                                                <div key={type} className="node-type-item">
                                                    <span className="type-name">{type}</span>
                                                    <span className="type-count">{count}</span>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Node Configuration Panel */}
            {selectedNode && (
                <NodeConfigPanel
                    node={selectedNode}
                    onUpdate={handleNodeConfigUpdate}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
};

export default Editor;