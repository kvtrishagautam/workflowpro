import React, { useState, useEffect } from 'react';
import Canvas from '../components/Canvas';
import NodePalette from '../components/NodePalette';
import RunHistory from '../components/RunHistory';
import WebhookConfigPanel from '../components/WebhookConfigPanel';
import NodeConfigPanel from '../components/NodeConfigPanel';
import { Workflow, NodeProps, NODE_TYPES, NodeTypeValue } from '../types';
import { WebhookConfig, DEFAULT_WEBHOOK_CONFIG } from '../types/nodes/webhook';
import { executeWorkflow as executeWorkflowInBrowser } from '../engine/executeWorkflow';
import { resumeDelayedRuns } from '../engine/resumeDelayedRuns';
import Modal from '../components/Modal';
import { createRun, updateRun } from '../store/runStore';
import { WorkflowRun } from '../types/run';
import { LayoutDashboard } from 'lucide-react';
import './Editor.css';

const Editor: React.FC<{}> = (): React.ReactElement => {

    const [workflow, setWorkflow] = useState<Workflow>({
        id: `workflow_${Date.now()}`,
        name: 'New Workflow',
        description: '',
        nodes: [],
        edges: [],
        stickyNotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);

    // Webhook config panel state
    const [selectedWebhookNode, setSelectedWebhookNode] = useState<NodeProps | null>(null);
    const [isWebhookPanelOpen, setIsWebhookPanelOpen] = useState(false);

    // Generic node config panel state
    const [selectedNode, setSelectedNode] = useState<NodeProps | null>(null);
    const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        content: React.ReactNode;
        type: 'info' | 'success' | 'error' | 'warning';
    }>({
        isOpen: false,
        title: '',
        content: null,
        type: 'info',
    });

    const showModal = (title: string, content: React.ReactNode, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void => {
        setModalConfig({ isOpen: true, title, content, type });
    };

    const closeModal = (): void => {
        setModalConfig({ ...modalConfig, isOpen: false });
    };

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
            case NODE_TYPES.EMAIL_DISCOVERY:
                config = {
                    urls: [],
                    keywords: [],
                    targetDomains: [],
                    industry: '',
                    maxEmails: 50,
                };
                break;
            case NODE_TYPES.EMAIL_SENDING:
                config = {
                    recipient: '',
                    subject: '',
                    body: '',
                    attachments: [],
                };
                break;
            case NODE_TYPES.SCHEDULED_EMAIL:
                config = {
                    subject: '',
                    body: '',
                    recipients: '',
                    recipientGroupId: '',
                    scheduledDateTime: '',
                    cronExpression: '',
                    scheduleType: 'one-time',
                    personalizationCSV: '',
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
                    conditionType: 'simple',
                    field: 'data.priority',
                    operator: 'equals',
                    value: 'Urgent',
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
                    range: 'A:Z', // Default to all columns
                    outputSpreadsheetId: '', // For writeToNewSheet
                    outputTabName: '', // For appendToNewTab
                    includeHeaders: true,
                    formatForVisualization: true,
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
            case NODE_TYPES.DASHBOARD_PORTAL:
                config = {
                    defaultCategory: 'Tasks'
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

    // Load workflow from ID if present in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const workflowId = params.get('id');

        if (workflowId) {
            loadWorkflow(workflowId);
        }
    }, []);

    const loadWorkflow = async (id: string) => {
        setIsLoadingDemo(true);
        try {
            const { WorkflowAPI } = await import('../services/workflowAPI');
            // Use API method which includes auth headers
            const savedWorkflow = await WorkflowAPI.getWorkflowById(id);

            // If it's the demo template, reset ID so it saves as a new user workflow
            if (savedWorkflow.isTemplate || id === 'wf-enterprise-demo') {
                savedWorkflow.id = `workflow_${Date.now()}`;
                savedWorkflow.name = `${savedWorkflow.name} (Copy)`;
                savedWorkflow.isTemplate = false; // Reset template flag
                // Clear URL param so it doesn't look like we're editing the template
                window.history.pushState({}, '', window.location.pathname);
            }

            // Transform backend workflow to frontend-friendly format (mostly making sure positions exist)
            // (Assuming backend format is compatible as we share types)
            setWorkflow({
                ...savedWorkflow,
                updatedAt: new Date().toISOString()
            });
            console.log('✅ Loaded workflow:', savedWorkflow.name);
        } catch (error) {
            console.error('Failed to load workflow:', error);
            showModal('Load Failed', 'Failed to load workflow. Check ID and try again.', 'error');
        } finally {
            setIsLoadingDemo(false);
        }
    };

    const handleSaveWorkflow = async () => {
        console.log('💾 Save button clicked!');
        setIsSaving(true);
        try {
            const { WorkflowAPI } = await import('../services/workflowAPI');
            const { toBackendWorkflow } = await import('../services/workflowConverter');

            const backendWorkflow = toBackendWorkflow(workflow);

            // Use the workflow's own id to decide CREATE vs UPDATE
            // If the workflow already has an id (set either from URL on load, or from a
            // previous successful save), UPDATE the existing record via PUT.
            // Only POST (create) when the workflow has never been saved before.
            const existingId = workflow.id;
            const params = new URLSearchParams(window.location.search);
            const isExistingWorkflow = !!params.get('id') || !!existingId;

            let response: { status: string; workflowId: string; webhooks?: any[] };
            if (isExistingWorkflow && existingId) {
                console.log(`♻️ Updating existing workflow: ${existingId}`);
                response = await WorkflowAPI.updateWorkflow(existingId, backendWorkflow);
            } else {
                console.log('🆕 Creating new workflow...');
                response = await WorkflowAPI.saveWorkflow(backendWorkflow);
            }

            console.log('✅ Workflow saved to backend:', response);

            // Update URL with the ID if it wasn't already there
            if (!params.get('id') && response.workflowId) {
                const newUrl = `${window.location.pathname}?id=${response.workflowId}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
                setWorkflow(prev => ({ ...prev, id: response.workflowId }));
            }

            // Log webhook URLs if any
            if (response.webhooks && response.webhooks.length > 0) {
                console.log('📍 Registered webhooks:');
                response.webhooks.forEach((webhook) => {
                    console.log(`   ${webhook.method} http://localhost:4000${webhook.path}`);
                });
            }
            setLastSaved(new Date().toLocaleTimeString());

            showModal(
                'Workflow Saved',
                <div>
                    <p>✅ Workflow <strong>{response.workflowId}</strong> {isExistingWorkflow ? 'updated' : 'created'} successfully!</p>
                    <p>{response.webhooks?.length || 0} webhook(s) registered.</p>
                </div>,
                'success'
            );
        } catch (error) {
            console.error('Failed to save workflow:', error);
            showModal('Save Failed', `Failed to save workflow: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExecuteBackend = async () => {
        const webhookNode = workflow.nodes.find(n => n.type === NODE_TYPES.WEBHOOK);
        if (!webhookNode) {
            alert('No Webhook node found to trigger.');
            return;
        }

        const config = webhookNode.data.config || {};
        const path = config.path || '/webhook'; // Fallback

        try {
            const { WorkflowAPI } = await import('../services/workflowAPI');
            const result = await WorkflowAPI.triggerWebhook(path, 'POST', {
                email: "demo@vip-client.com",
                name: "Demo User",
                amount: 5000,
                company: "Tech Corp",
                message: "Testing from Frontend"
            });
            // alert(`✅ Backend Execution Triggered!\nCheck Slack/Email.\nResult: ${JSON.stringify(result)}`);
            showModal(
                'Execution Success',
                <div>
                    <p>✅ Backend Execution Triggered!</p>
                    <p>Check your Slack workspace and Email inbox for results.</p>
                    <details style={{ marginTop: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>View Response Data</summary>
                        <pre style={{ fontSize: '11px', overflow: 'auto' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>,
                'success'
            );
        } catch (error) {
            console.error('Execution failed:', error);
            showModal('Execution Failed', `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    const handleRunWorkflow = async () => {
        console.log('🚀 Run button clicked!');

        // Create a run entry so RunHistory tracks it
        const run: WorkflowRun = createRun();
        run.workflowId = workflow.id;

        try {
            console.clear();

            // Check if workflow has email-specific nodes that require backend execution
            const hasEmailNodes = workflow.nodes.some(n =>
                n.type === 'emailDiscovery' ||
                n.type === 'emailSending' ||
                n.type === 'scheduledEmail'
            );

            if (hasEmailNodes) {
                // Use backend API for email workflows
                console.log('🚀 Starting workflow execution via backend API (email workflow)...');

                const { apiService } = await import('../services/api');
                const result = await apiService.executeWorkflow(workflow);

                if (result.status === 'success') {
                    console.log('✅ Workflow executed successfully!');
                    console.log('Results:', result.results);

                    // Record each node result as a log entry
                    if (result.results) {
                        result.results.forEach((nodeResult: any) => {
                            run.logs.push({
                                nodeId: nodeResult.nodeId,
                                nodeType: nodeResult.nodeType,
                                input: {},
                                output: nodeResult.result?.data,
                                status: nodeResult.result?.status === 'success' ? 'success' : 'failed',
                                error: nodeResult.result?.error,
                                timestamp: Date.now(),
                            });
                        });
                    }

                    run.status = 'success';
                    run.finishedAt = Date.now();
                    updateRun(run);

                    showModal('Execution Success', '✅ Workflow executed successfully! Check console for details.', 'success');
                } else {
                    console.error('❌ Workflow execution failed:', result.error);

                    run.logs.push({
                        nodeId: 'workflow',
                        nodeType: 'workflow',
                        input: {},
                        status: 'failed',
                        error: result.error,
                        timestamp: Date.now(),
                    });
                    run.status = 'failed';
                    run.finishedAt = Date.now();
                    updateRun(run);

                    showModal('Execution Failed', `❌ Workflow failed: ${result.error}`, 'error');
                }
            } else {
                // Use frontend engine for schedule/webhook/general workflows
                console.log('🚀 Starting workflow execution in browser...');
                const testPayload = {
                    amount: 1500,
                    department: 'sales',
                    customerName: 'Test User',
                    timestamp: new Date().toISOString(),
                };
                await executeWorkflowInBrowser(workflow, testPayload);
                console.log('✅ Workflow executed successfully!');

                run.status = 'success';
                run.finishedAt = Date.now();
                updateRun(run);

                showModal('Execution Success', '✅ Workflow executed successfully in browser!', 'success');
            }
        } catch (error) {
            console.error('❌ Workflow execution failed:', error);

            run.logs.push({
                nodeId: 'workflow',
                nodeType: 'workflow',
                input: {},
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now(),
            });
            run.status = 'failed';
            run.finishedAt = Date.now();
            updateRun(run);

            showModal('Execution Failed', `❌ Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    };

    const handleImportWorkflow = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const importedWorkflow = JSON.parse(text);

                // Convert backend format to frontend format if needed
                const nodes = importedWorkflow.nodes.map((node: any) => ({
                    id: node.id,
                    type: node.type,
                    data: {
                        label: node.data?.label || `${node.type} Node`,
                        config: node.config || node.data?.config || {},
                    },
                    position: node.position || { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
                }));

                setWorkflow({
                    id: importedWorkflow.id || `workflow_${Date.now()}`,
                    name: importedWorkflow.name || 'Imported Workflow',
                    description: importedWorkflow.description || '',
                    nodes: nodes,
                    edges: importedWorkflow.edges || [],
                    createdAt: importedWorkflow.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                console.log('✅ Workflow imported successfully:', importedWorkflow.id);
                alert(`✅ Workflow "${importedWorkflow.name || 'Imported Workflow'}" loaded successfully!\n${nodes.length} nodes imported.`);
            } catch (error) {
                console.error('Failed to import workflow:', error);
                alert(`❌ Failed to import workflow: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
            }
        };
        input.click();
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
                    <button
                        className="secondary-button"
                        onClick={() => window.location.href = '/profile'}
                        style={{ marginRight: '15px', padding: '6px 12px' }}
                    >
                        ⬅ Profile
                    </button>
                    <div className="workflow-stats">
                        <span title={`Nodes: ${workflow.nodes.length}`}>🔧 {workflow.nodes.length}</span>
                        <span title={`Connections: ${workflow.edges.length}`}>🔗 {workflow.edges.length}</span>
                        {lastSaved && <span className="last-saved">Last saved: {lastSaved}</span>}
                    </div>

                    {/* COMMENTED OUT: Import button
                    <button
                        className="import-button"
                        onClick={handleImportWorkflow}
                        title="Import workflow from JSON file"
                    >
                        📂 Import
                    </button>
                    */}

                    <button
                        className="run-button"
                        onClick={handleRunWorkflow}
                        disabled={workflow.nodes.length === 0}
                        title="Run workflow with test data (check console for output)"
                    >
                        ▶️ Run
                    </button>

                    <button
                        className="run-button"
                        onClick={handleExecuteBackend}
                        style={{ backgroundColor: '#8b5cf6', marginLeft: '10px' }}
                        title="Trigger Webhook on Backend (Real Execution)"
                    >
                        🚀 Execute Backend
                    </button>
                    {!new URLSearchParams(window.location.search).get('id') && (

                        <button
                            className="secondary-button"
                            onClick={() => loadWorkflow('wf-enterprise-demo')}
                            style={{ marginRight: '10px' }}
                            disabled={isLoadingDemo}
                        >
                            {isLoadingDemo ? '📂 Loading...' : '📂 Load Demo'}
                        </button>
                    )}

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


            {/* Global Modal */}
            <Modal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                content={modalConfig.content}
                type={modalConfig.type}
                onClose={closeModal}
            />
        </div >
    );
};

export default Editor;