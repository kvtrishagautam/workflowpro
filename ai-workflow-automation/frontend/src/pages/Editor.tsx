import React, { useState } from 'react';
import Canvas from '../components/Canvas';
import NodePalette from '../components/NodePalette';
import { Workflow } from '../types';
import { apiService, WorkflowExecutionResult } from '../services/api';
import './Editor.css';



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

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);

    const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId);

    const handleWorkflowChange = (updatedWorkflow: Workflow) => {
        setWorkflow({
            ...updatedWorkflow,
            updatedAt: new Date().toISOString(),
        });
    };

    const handleConfigChange = (nodeId: string, key: string, value: any) => {
        let processedValue = value;
        if (key === 'keywords' && typeof value === 'string') {
            processedValue = value.split(',').map(s => s.trim()).filter(s => s !== '');
        }

        const updatedNodes = workflow.nodes.map(node => {
            if (node.id === nodeId) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        config: {
                            ...node.data.config,
                            [key]: processedValue
                        }
                    }
                };
            }
            return node;
        });

        handleWorkflowChange({
            ...workflow,
            nodes: updatedNodes
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
        setSelectedNodeId(newNode.id);
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

    const handleRunWorkflow = async () => {
        if (workflow.nodes.length === 0) {
            alert('Please add at least one node to the workflow before running.');
            return;
        }

        setIsExecuting(true);
        setExecutionResult(null);

        try {
            console.log('Executing workflow:', workflow);
            const result = await apiService.executeWorkflow(workflow);
            setExecutionResult(result);

            if (result.status === 'success') {
                console.log('Workflow executed successfully:', result);
            } else {
                console.error('Workflow execution failed:', result.error);
            }
        } catch (error) {
            console.error('Error executing workflow:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to execute workflow';
            setExecutionResult({
                status: 'error',
                error: errorMessage
            });
        } finally {
            setIsExecuting(false);
        }
    };

    const renderConfigField = (nodeId: string, key: string, value: any, type: string = 'text') => {
        return (
            <div className="property-field" key={key}>
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                {type === 'textarea' ? (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleConfigChange(nodeId, key, e.target.value)}
                        placeholder={`Enter ${key}...`}
                    />
                ) : (
                    <input
                        type={type}
                        value={value || ''}
                        onChange={(e) => handleConfigChange(nodeId, key, e.target.value)}
                        placeholder={`Enter ${key}...`}
                    />
                )}
            </div>
        );
    };

    const renderNodeProperties = () => {
        if (!selectedNode) return (
            <div className="empty-properties">
                <p>No node selected</p>
                <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Click a node on the canvas to edit its properties
                </p>
            </div>
        );

        return (
            <div className="properties-form">
                <div className="property-header">
                    <h4>{selectedNode.type.toUpperCase()} Node</h4>
                    <small>ID: {selectedNode.id}</small>
                </div>

                <div className="property-section">
                    <label>Node Label</label>
                    <input
                        type="text"
                        value={selectedNode.data.label}
                        onChange={(e) => {
                            const updatedNodes = workflow.nodes.map(n =>
                                n.id === selectedNode.id ? { ...n, data: { ...n.data, label: e.target.value } } : n
                            );
                            handleWorkflowChange({ ...workflow, nodes: updatedNodes });
                        }}
                    />
                </div>

                <div className="property-section">
                    <h5>Configuration</h5>
                    {selectedNode.type === 'emailDiscovery' && (
                        <div>
                            {renderConfigField(selectedNode.id, 'keywords',
                                Array.isArray(selectedNode.data.config?.keywords) ? selectedNode.data.config?.keywords.join(', ') : selectedNode.data.config?.keywords || '',
                                'text'
                            )}
                            <small style={{ fontSize: '10px', color: '#64748b' }}>Enter keywords separated by commas</small>
                            {renderConfigField(selectedNode.id, 'industry', selectedNode.data.config?.industry)}
                        </div>
                    )}

                    {selectedNode.type === 'emailSending' && (
                        <div>
                            {renderConfigField(selectedNode.id, 'recipient', selectedNode.data.config?.recipient)}
                            <small style={{ fontSize: '10px', color: '#64748b' }}>Leave blank to use discovered emails from previous node</small>
                            {renderConfigField(selectedNode.id, 'subject', selectedNode.data.config?.subject)}
                            {renderConfigField(selectedNode.id, 'body', selectedNode.data.config?.body, 'textarea')}
                        </div>
                    )}

                    {!['emailDiscovery', 'emailSending'].includes(selectedNode.type) && (
                        <p style={{ fontSize: '12px', color: '#64748b' }}>Generic configuration for this node type is coming soon.</p>
                    )}
                </div>
            </div>
        );
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
                        className={`save-button ${isExecuting ? 'saving' : ''}`}
                        onClick={handleRunWorkflow}
                        disabled={isExecuting || workflow.nodes.length === 0}
                        style={{ marginLeft: '10px', background: isExecuting ? '#10B981' : '#8B5CF6' }}
                    >
                        {isExecuting ? '⚡ Running...' : '⚡ Run Workflow'}
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
                    onNodeSelect={setSelectedNodeId}
                    selectedNodeId={selectedNodeId}
                />

                {/* Properties Panel (Right Sidebar) */}
                <div className="editor-properties">
                    <div className="properties-header">
                        <h3>Properties</h3>
                    </div>

                    <div className="properties-content">
                        {renderNodeProperties()}
                        <div className="properties-stats">
                            <div className="stat-item">
                                <label>Workflow Summary</label>
                                <div className="stat-value">{workflow.nodes.length} nodes, {workflow.edges.length} connections</div>
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

                            {/* Execution Results */}
                            {executionResult && (
                                <div className="stat-item" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                    <label>Execution Status</label>
                                    <div className="stat-value" style={{
                                        color: executionResult.status === 'success' ? '#10B981' : '#EF4444',
                                        fontWeight: 'bold'
                                    }}>
                                        {executionResult.status === 'success' ? '✅ Success' : '❌ Failed'}
                                    </div>
                                    {executionResult.error && (
                                        <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '8px' }}>
                                            {executionResult.error}
                                        </p>
                                    )}
                                    {executionResult.results && (
                                        <div style={{ marginTop: '10px', fontSize: '11px' }}>
                                            <strong>Results:</strong>
                                            <pre style={{
                                                background: '#1e293b',
                                                color: '#10B981',
                                                padding: '10px',
                                                borderRadius: '4px',
                                                maxHeight: '200px',
                                                overflow: 'auto',
                                                marginTop: '8px'
                                            }}>
                                                {JSON.stringify(executionResult.results, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;