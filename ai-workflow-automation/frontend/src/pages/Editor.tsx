import React, { useState, useEffect } from 'react';
import Canvas from '../components/Canvas';
import NodePalette from '../components/NodePalette';
import RunHistory from '../components/RunHistory';
import WebhookConfigPanel from '../components/WebhookConfigPanel';
import NodeConfigPanel from '../components/NodeConfigPanel';
import { Workflow, NodeProps, NODE_TYPES } from '../types';
import { WebhookConfig, DEFAULT_WEBHOOK_CONFIG } from '../types/nodes/webhook';
import { executeWorkflow } from '../engine/executeWorkflow';
import { resumeDelayedRuns } from '../engine/resumeDelayedRuns';
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

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Webhook config panel state
    const [selectedWebhookNode, setSelectedWebhookNode] = useState<NodeProps | null>(null);
    const [isWebhookPanelOpen, setIsWebhookPanelOpen] = useState(false);

    // Generic node config panel state
    const [selectedNode, setSelectedNode] = useState<NodeProps | null>(null);
    const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);

    useEffect(() => {
        resumeDelayedRuns(workflow);
    }, []);

    const handleWorkflowChange = (updatedWorkflow: Workflow) => {
        setWorkflow({
            ...updatedWorkflow,
            updatedAt: new Date().toISOString(),
        });
    };

    const handleAddNode = (nodeType: string) => {
        let config: Record<string, any> = {};
        
        // Set default configuration based on node type
        switch (nodeType) {
            case NODE_TYPES.WEBHOOK:
                config = {
                    path: '/webhook-' + Math.random().toString(36).substring(2, 8),
                    httpMethod: 'POST',
                    method: 'POST',
                    authentication: 'none',
                    responseMode: 'immediately',
                    responseCode: 200,
                    responseData: 'firstEntryJson',
                    options: {
                        allowedOrigins: '*',
                        ignoreBots: false,
                        rawBody: false,
                        noResponseBody: false,
                    },
                };
                break;
            case NODE_TYPES.SCHEDULE:
                config = {
                    triggerType: 'interval',
                    interval: 15,
                    unit: 'minutes',
                    cronExpression: '',
                    timezone: 'UTC',
                };
                break;
            case NODE_TYPES.EMAIL:
                config = {
                    to: '',
                    subject: '',
                    body: '',
                    bodyType: 'text',
                    cc: '',
                    bcc: '',
                    attachments: [],
                };
                break;
            case NODE_TYPES.WHATSAPP:
            case NODE_TYPES.TELEGRAM:
                config = {
                    to: '',
                    message: '',
                    parseMode: 'text',
                };
                break;
            case NODE_TYPES.DISCORD:
                config = {
                    webhookUrl: '',
                    content: '',
                    username: '',
                    embeds: [],
                };
                break;
            case NODE_TYPES.SLACK:
                config = {
                    channel: '',
                    message: '',
                    username: '',
                    iconEmoji: '',
                };
                break;
            case NODE_TYPES.HTTP:
                config = {
                    method: 'GET',
                    url: '',
                    headers: {},
                    body: '',
                    timeout: 30000,
                };
                break;
            case NODE_TYPES.CONDITIONAL:
                config = {
                    conditions: [],
                    combineOperation: 'all',
                };
                break;
            case NODE_TYPES.DELAY:
                config = {
                    duration: 10,
                    unit: 'seconds',
                };
                break;
            case NODE_TYPES.SET:
                config = {
                    fields: [],
                    keepOnlySet: false,
                };
                break;
            case NODE_TYPES.FILTER:
                config = {
                    conditions: [],
                    combineOperation: 'all',
                };
                break;
            case NODE_TYPES.MERGE:
                config = {
                    mode: 'append',
                    propertyName: 'data',
                };
                break;
            case NODE_TYPES.SPLIT_BATCHES:
                config = {
                    batchSize: 10,
                    options: { reset: false },
                };
                break;
            case NODE_TYPES.GOOGLE_SHEETS:
                config = {
                    operation: 'read',
                    spreadsheetId: '',
                    sheetName: '',
                    range: '',
                };
                break;
            case NODE_TYPES.AIRTABLE:
                config = {
                    operation: 'list',
                    baseId: '',
                    tableId: '',
                };
                break;
            case NODE_TYPES.NOTION:
                config = {
                    resource: 'page',
                    operation: 'get',
                    databaseId: '',
                };
                break;
            case NODE_TYPES.MYSQL:
            case NODE_TYPES.POSTGRES:
                config = {
                    operation: 'select',
                    table: '',
                    columns: '*',
                    where: '',
                };
                break;
            case NODE_TYPES.OPENAI:
                config = {
                    model: 'gpt-3.5-turbo',
                    operation: 'chat',
                    prompt: '',
                    maxTokens: 1000,
                    temperature: 0.7,
                };
                break;
            case NODE_TYPES.JAVASCRIPT:
                config = {
                    code: '// Access input data with $input\nreturn $input;',
                };
                break;
            default:
                config = {};
        }

        const newNode: any = {
            id: `node_${Date.now()}`,
            type: nodeType,
            data: {
                label: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace(/([A-Z])/g, ' $1')} Node`,
                config,
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
            // Import required utilities dynamically
            const { WorkflowAPI } = await import('../services/workflowAPI');
            const { toBackendWorkflow } = await import('../services/workflowConverter');

            // Convert and save to backend
            const backendWorkflow = toBackendWorkflow(workflow);
            const response = await WorkflowAPI.saveWorkflow(backendWorkflow);

            console.log('✅ Workflow saved to backend:', response);

            // Log webhook URLs if any
            if (response.webhooks && response.webhooks.length > 0) {
                console.log('📍 Registered webhooks:');
                response.webhooks.forEach((webhook) => {
                    console.log(`   ${webhook.method} http://localhost:4000${webhook.path}`);
                });
            }

            setLastSaved(new Date().toLocaleTimeString());

            // Show success notification
            alert(`✅ Workflow saved successfully!\n${response.webhooks?.length || 0} webhook(s) registered.`);
        } catch (error) {
            console.error('Failed to save workflow:', error);
            alert(`❌ Failed to save workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };


    const handleRunWorkflow = async () => {
        try {
            console.clear();
            console.log('🚀 Starting workflow execution...');
            const testPayload = {
                amount: 75000,
                department: 'sales',
                timestamp: new Date().toISOString(),
            };
            await executeWorkflow(workflow, testPayload);
        } catch (error) {
            console.error('Workflow execution failed:', error);
            alert(`Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Webhook panel handlers
    const handleOpenWebhookConfig = (node: NodeProps) => {
        setSelectedWebhookNode(node);
        setIsWebhookPanelOpen(true);
        setIsNodeConfigOpen(false);
        setSelectedNode(null);
    };

    const handleCloseWebhookConfig = () => {
        setIsWebhookPanelOpen(false);
        setSelectedWebhookNode(null);
    };

    // Generic node config handlers
    const handleOpenNodeConfig = (node: NodeProps) => {
        // Use webhook panel for webhook nodes for better UX
        if (node.type === NODE_TYPES.WEBHOOK) {
            handleOpenWebhookConfig(node);
            return;
        }
        setSelectedNode(node);
        setIsNodeConfigOpen(true);
        setIsWebhookPanelOpen(false);
        setSelectedWebhookNode(null);
    };

    const handleCloseNodeConfig = () => {
        setIsNodeConfigOpen(false);
        setSelectedNode(null);
    };

    const handleNodeConfigChange = (nodeId: string, newConfig: Record<string, any>) => {
        const updatedNodes = workflow.nodes.map((n) =>
            n.id === nodeId
                ? {
                    ...n,
                    data: {
                        ...n.data,
                        config: newConfig,
                    },
                }
                : n
        );

        setWorkflow({
            ...workflow,
            nodes: updatedNodes,
            updatedAt: new Date().toISOString(),
        });

        // Update selected node reference
        if (selectedNode && selectedNode.id === nodeId) {
            const updatedNode = updatedNodes.find((n) => n.id === nodeId);
            if (updatedNode) {
                setSelectedNode(updatedNode);
            }
        }
    };

    const handleWebhookConfigChange = (newConfig: WebhookConfig) => {
        if (!selectedWebhookNode) return;

        const updatedNodes = workflow.nodes.map((n) =>
            n.id === selectedWebhookNode.id
                ? {
                    ...n,
                    data: {
                        ...n.data,
                        config: {
                            ...n.data.config,
                            path: newConfig.path,
                            httpMethod: newConfig.httpMethod,
                            method: newConfig.httpMethod, // Keep backward compatibility
                            authentication: newConfig.authentication,
                            responseMode: newConfig.responseMode,
                            responseCode: newConfig.responseCode,
                            responseData: newConfig.responseData,
                            basicAuthCredentials: newConfig.basicAuthCredentials,
                            headerAuthCredentials: newConfig.headerAuthCredentials,
                            options: newConfig.options,
                        },
                    },
                }
                : n
        );

        setWorkflow({
            ...workflow,
            nodes: updatedNodes,
            updatedAt: new Date().toISOString(),
        });
    };

    const getWebhookConfig = (): Partial<WebhookConfig> => {
        if (!selectedWebhookNode) return DEFAULT_WEBHOOK_CONFIG;
        const config = selectedWebhookNode.data.config || {};
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
                        className="run-button"
                        onClick={handleRunWorkflow}
                        disabled={workflow.nodes.length === 0}
                        title="Run workflow with test data (check console for output)"
                    >
                        ▶️ Run
                    </button>

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
                <Canvas
                    workflow={workflow}
                    onWorkflowChange={handleWorkflowChange}
                    onOpenWebhookConfig={handleOpenWebhookConfig}
                    onOpenNodeConfig={handleOpenNodeConfig}
                />

                {/* Right Side Panel - Run History, Webhook Config, or Node Config */}
                <div className={`editor-right-panel ${isWebhookPanelOpen || isNodeConfigOpen ? 'config-mode' : ''}`}>
                    {isWebhookPanelOpen && selectedWebhookNode ? (
                        <WebhookConfigPanel
                            config={getWebhookConfig()}
                            onConfigChange={handleWebhookConfigChange}
                            onClose={handleCloseWebhookConfig}
                            isOpen={true}
                        />
                    ) : isNodeConfigOpen && selectedNode ? (
                        <NodeConfigPanel
                            node={selectedNode}
                            onConfigChange={handleNodeConfigChange}
                            onClose={handleCloseNodeConfig}
                        />
                    ) : (
                        <RunHistory />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Editor;