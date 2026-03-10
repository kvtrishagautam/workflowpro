import React, { useRef, useState } from 'react';
import { Workflow, NodeProps } from '../types';
import WorkflowNode from './WorkflowNode';
import './Canvas.css';

type CanvasProps = {
    workflow?: Workflow | null;
    onWorkflowChange?: (workflow: Workflow) => void;
    onOpenWebhookConfig?: (node: NodeProps) => void;
    onOpenNodeConfig?: (node: NodeProps) => void;
};

const Canvas: React.FC<CanvasProps> = ({ workflow, onWorkflowChange, onOpenWebhookConfig, onOpenNodeConfig }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handle?: string } | null>(null);
    const [connectionEnd, setConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const [spacePressed, setSpacePressed] = useState(false);

    // Auto-fit view when loading a new workflow
    React.useEffect(() => {
        if (workflow?.nodes && workflow.nodes.length > 0) {
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                fitView();
            }, 150);
            return () => clearTimeout(timer);
        } else {
            // Reset to default for empty
            setZoom(1);
            setPan({ x: 0, y: 0 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflow?.id]); // Only trigger when workflow ID changes

    const fitView = () => {
        if (!workflow?.nodes || workflow.nodes.length === 0 || !canvasRef.current) return;

        const padding = 80;
        const nodes = workflow.nodes;

        // Calculate bounding box
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            // Estimate node size if not measurable yet (standard node width ~250, height ~150-300)
            const nodeWidth = 250;
            const nodeHeight = 200;
            maxX = Math.max(maxX, node.position.x + nodeWidth);
            maxY = Math.max(maxY, node.position.y + nodeHeight);
        });

        // Get canvas dimensions
        const { width: canvasWidth, height: canvasHeight } = canvasRef.current.getBoundingClientRect();
        if (canvasWidth === 0 || canvasHeight === 0) return; // Wait until properly rendered

        // Calculate scale
        const contentWidth = maxX - minX + (padding * 2);
        const contentHeight = maxY - minY + (padding * 2);

        const scaleX = canvasWidth / contentWidth;
        const scaleY = canvasHeight / contentHeight;
        const newZoom = Math.min(Math.min(scaleX, scaleY), 1); // Don't zoom in more than 100%

        // Calculate center
        const contentCenterX = minX + (contentWidth / 2) - padding;
        const contentCenterY = minY + (contentHeight / 2) - padding;

        const panX = (canvasWidth / 2) - (contentCenterX * newZoom);
        const panY = (canvasHeight / 2) - (contentCenterY * newZoom);

        setZoom(newZoom);
        setPan({ x: panX, y: panY });
    };

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                setSpacePressed(true);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedEdge) {
                    e.preventDefault();
                    handleEdgeDelete(selectedEdge);
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                setSpacePressed(false);
                setIsPanning(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedEdge]);

    if (!workflow) {
        return <div className="canvas empty">No workflow loaded</div>;
    }

    const handleNodeSelect = (nodeId: string) => {
        setSelectedNodeId(nodeId);
        setSelectedEdge(null);
    };

    const handleNodeDelete = (nodeId: string) => {
        const updatedNodes = workflow.nodes.filter((n) => n.id !== nodeId);
        const updatedEdges = workflow.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

        const updated = {
            ...workflow,
            nodes: updatedNodes,
            edges: updatedEdges,
        };

        onWorkflowChange?.(updated);
        setSelectedNodeId(null);
        setSelectedEdge(null);
    };

    const handleEdgeDelete = (edgeId: string) => {
        const updatedEdges = workflow.edges.filter((e) => e.id !== edgeId);
        const updated = {
            ...workflow,
            edges: updatedEdges,
        };
        onWorkflowChange?.(updated);
        setSelectedEdge(null);
        setHoveredEdge(null);
    };

    // Node dragging with MouseEvent
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;

        setDraggedNode(nodeId);
        setDragOffset({
            x: mouseX - node.position.x,
            y: mouseY - node.position.y,
        });
    };

    // Connector click to start connection
    const handleConnectorMouseDown = (e: React.MouseEvent, nodeId: string, connectorType: 'input' | 'output', handle?: string) => {
        e.stopPropagation();

        // Only allow connections from output connectors
        if (connectorType === 'output') {
            setIsConnecting(true);
            setConnectionStart({ nodeId, handle });

            const canvas = canvasRef.current;
            if (!canvas) return;

            const node = workflow.nodes.find((n) => n.id === nodeId);
            if (!node) return;

            const nodeDims = getNodeDimensions(nodeId);

            // Position based on connector type for conditional nodes
            let x, y;
            if (node.type === 'conditional' && handle === 'true') {
                // TRUE connector on right side
                x = node.position.x + nodeDims.width;
                y = node.position.y + nodeDims.height / 2;
            } else {
                // Standard or FALSE connector at bottom
                x = node.position.x + nodeDims.width / 2;
                y = node.position.y + nodeDims.height;
            }

            setConnectionEnd({ x, y });
        }
    };

    // Connector mouse up to complete connection
    const handleConnectorMouseUp = (e: React.MouseEvent, nodeId: string, connectorType: 'input' | 'output', handle?: string) => {
        e.stopPropagation();

        if (isConnecting && connectionStart && connectorType === 'input' && connectionStart.nodeId !== nodeId) {
            // Check if edge already exists
            const edgeExists = workflow.edges.some(
                (edge) => edge.source === connectionStart.nodeId && edge.target === nodeId
            );

            if (!edgeExists) {
                const newEdge: any = {
                    id: `edge_${Date.now()}`,
                    source: connectionStart.nodeId,
                    target: nodeId,
                    sourceHandle: connectionStart.handle,
                };

                const updated = {
                    ...workflow,
                    edges: [...workflow.edges, newEdge],
                };

                onWorkflowChange?.(updated);
            }
        }

        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionEnd(null);
    };

    const handleCanvasDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();

        const nodeType = e.dataTransfer?.getData('nodeType');
        if (!nodeType) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;

        let config: Record<string, any> = {};
        if (nodeType === 'webhook') {
            config = { path: '/example-webhook', method: 'POST' };
        } else if (nodeType === 'delay') {
            config = { duration: 10, unit: 'seconds' };
        }

        const newNode: any = {
            id: `node_${Date.now()}`,
            type: nodeType,
            data: {
                label: `${nodeType} Node`,
                config,
            },
            position: { x: Math.max(0, x), y: Math.max(0, y) },
        };

        const updated = {
            ...workflow,
            nodes: [...workflow.nodes, newNode],
        };

        onWorkflowChange?.(updated);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        // Handle canvas panning (with space or middle mouse button)
        if (isPanning && panStart && (spacePressed || e.buttons === 4)) {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            setPan(prev => ({
                x: prev.x + dx,
                y: prev.y + dy,
            }));
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        // Handle node dragging
        if (draggedNode && e.buttons === 1 && !spacePressed) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left - pan.x) / zoom;
            const mouseY = (e.clientY - rect.top - pan.y) / zoom;

            const updatedNodes = workflow.nodes.map((n) =>
                n.id === draggedNode
                    ? {
                        ...n,
                        position: {
                            x: Math.max(0, mouseX - dragOffset.x),
                            y: Math.max(0, mouseY - dragOffset.y),
                        },
                    }
                    : n
            );

            const updated = {
                ...workflow,
                nodes: updatedNodes,
            };

            onWorkflowChange?.(updated);
        }

        // Handle connection preview
        if (isConnecting && connectionStart) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;

            setConnectionEnd({ x, y });
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggedNode(null);
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionEnd(null);
        setIsPanning(false);
        setPanStart(null);
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Start panning with space + left click or middle mouse button
        if (spacePressed || e.button === 1) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
        } else {
            // Deselect edge when clicking on empty canvas
            setSelectedEdge(null);
        }
    };

    const handleMouseWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const direction = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.5, Math.min(2, zoom + direction));

        const zoomDiff = newZoom - zoom;

        setPan({
            x: pan.x - (x * zoomDiff) / zoom,
            y: pan.y - (y * zoomDiff) / zoom,
        });

        setZoom(newZoom);
    };

    // Helper function to get node dimensions
    const getNodeDimensions = (nodeId: string) => {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            const rect = nodeElement.getBoundingClientRect();
            return {
                width: rect.width / zoom,
                height: rect.height / zoom,
            };
        }
        // Default dimensions if element not found
        return { width: 220, height: 200 };
    };

    // Node config update handler
    const handleNodeUpdate = (nodeId: string, updatedNode: NodeProps) => {
        const updatedNodes = workflow.nodes.map((n) => (n.id === nodeId ? updatedNode : n));
        const updated = {
            ...workflow,
            nodes: updatedNodes,
        };
        onWorkflowChange?.(updated);
    };

    return (
        <div
            className={`canvas ${spacePressed ? 'panning-mode' : ''}`}
            ref={canvasRef}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseDown={handleCanvasMouseDown}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleMouseWheel}
        >
            {/* Grid Background */}
            <div className="canvas-grid" />

            {/* Content Container with Transform */}
            <div
                className="canvas-content"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            >
                {/* Nodes */}
                <div className="nodes-layer">
                    {workflow.nodes.map((node) => (
                        <WorkflowNode
                            key={node.id}
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            onSelect={handleNodeSelect}
                            onDelete={handleNodeDelete}
                            onMouseDown={handleNodeMouseDown}
                            onConnectorMouseDown={handleConnectorMouseDown}
                            onConnectorMouseUp={handleConnectorMouseUp}
                            onUpdate={handleNodeUpdate}
                            onOpenWebhookConfig={onOpenWebhookConfig}
                            onOpenNodeConfig={onOpenNodeConfig}
                        />
                    ))}
                </div>

                {/* Connections SVG Layer */}
                <svg
                    className="connections-layer"
                    style={{ width: '100%', height: '100%', overflow: 'visible' }}
                >
                    <defs>
                        {/* Arrow marker for connection endpoints */}
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="10"
                            refX="8"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L0,6 L9,3 z" fill="#7c3aed" />
                        </marker>
                        <marker
                            id="arrowhead-hover"
                            markerWidth="10"
                            markerHeight="10"
                            refX="8"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L0,6 L9,3 z" fill="#a78bfa" />
                        </marker>
                        <marker
                            id="arrowhead-selected"
                            markerWidth="10"
                            markerHeight="10"
                            refX="8"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L0,6 L9,3 z" fill="#c084fc" />
                        </marker>
                        <marker
                            id="arrowhead-preview"
                            markerWidth="10"
                            markerHeight="10"
                            refX="8"
                            refY="3"
                            orient="auto"
                            markerUnits="strokeWidth"
                        >
                            <path d="M0,0 L0,6 L9,3 z" fill="#a78bfa" opacity="0.6" />
                        </marker>
                    </defs>
                    {/* Render existing edges */}
                    {workflow.edges.map((edge) => {
                        const sourceNode = workflow.nodes.find((n) => n.id === edge.source);
                        const targetNode = workflow.nodes.find((n) => n.id === edge.target);

                        if (!sourceNode || !targetNode) return null;

                        // Get actual node dimensions
                        const sourceDims = getNodeDimensions(sourceNode.id);
                        const targetDims = getNodeDimensions(targetNode.id);

                        // Calculate connection points
                        // Handle conditional nodes: TRUE connector on right side, FALSE at bottom
                        let x1, y1;
                        if (sourceNode.type === 'conditional' && edge.sourceHandle === 'true') {
                            // TRUE connector is on the right side
                            x1 = sourceNode.position.x + sourceDims.width;
                            y1 = sourceNode.position.y + sourceDims.height / 2;
                        } else {
                            x1 = sourceNode.position.x + sourceDims.width / 2;
                            y1 = sourceNode.position.y + sourceDims.height;
                        }

                        // Input connector is at the top center of the target node
                        const x2 = targetNode.position.x + targetDims.width / 2;
                        const y2 = targetNode.position.y;

                        // Calculate control points for smooth bezier curve
                        const distance = Math.abs(y2 - y1);
                        const curveStrength = Math.min(distance * 0.6, 200);
                        const cx1 = x1;
                        const cy1 = y1 + curveStrength;
                        const cx2 = x2;
                        const cy2 = y2 - curveStrength;

                        const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

                        const isHovered = hoveredEdge === edge.id;
                        const isSelected = selectedEdge === edge.id;

                        // Determine color based on branch type
                        const isTrueBranch = edge.sourceHandle === 'true';
                        const isFalseBranch = edge.sourceHandle === 'false';
                        let strokeColor = '#7c3aed'; // Default purple
                        let markerColor = '#7c3aed';

                        if (isTrueBranch) {
                            strokeColor = '#22c55e'; // Green for true
                            markerColor = '#22c55e';
                        } else if (isFalseBranch) {
                            strokeColor = '#ef4444'; // Red for false
                            markerColor = '#ef4444';
                        }

                        return (
                            <g key={edge.id}>
                                {/* Invisible wider path for easier hovering/clicking */}
                                <path
                                    d={path}
                                    stroke="transparent"
                                    strokeWidth="20"
                                    fill="none"
                                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                    onMouseEnter={() => setHoveredEdge(edge.id)}
                                    onMouseLeave={() => setHoveredEdge(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedEdge(edge.id);
                                    }}
                                />
                                {/* Visible connection path */}
                                <path
                                    className={`connection ${isSelected ? 'connection-selected' : isHovered ? 'connection-hover' : ''
                                        }`}
                                    d={path}
                                    stroke={isSelected || isHovered ? undefined : strokeColor}
                                    markerEnd={`url(#arrowhead${isSelected ? '-selected' : isHovered ? '-hover' : ''})`}
                                    style={{ pointerEvents: 'none' }}
                                />
                            </g>
                        );
                    })}

                    {/* Render connection preview */}
                    {isConnecting && connectionStart && connectionEnd && (() => {
                        const sourceNode = workflow.nodes.find((n) => n.id === connectionStart.nodeId);
                        if (!sourceNode) return null;

                        const sourceDims = getNodeDimensions(sourceNode.id);

                        // Calculate start position based on handle type
                        let x1, y1;
                        if (sourceNode.type === 'conditional' && connectionStart.handle === 'true') {
                            // TRUE connector on right side
                            x1 = sourceNode.position.x + sourceDims.width;
                            y1 = sourceNode.position.y + sourceDims.height / 2;
                        } else {
                            x1 = sourceNode.position.x + sourceDims.width / 2;
                            y1 = sourceNode.position.y + sourceDims.height;
                        }

                        const x2 = connectionEnd.x;
                        const y2 = connectionEnd.y;

                        // Calculate control points for preview
                        const distance = Math.abs(y2 - y1);
                        const curveStrength = Math.min(distance * 0.6, 200);
                        const cx1 = x1;
                        const cy1 = y1 + curveStrength;
                        const cx2 = x2;
                        const cy2 = y2 - curveStrength;

                        // Color based on handle
                        let strokeColor = '#a78bfa'; // Default purple
                        if (connectionStart.handle === 'true') {
                            strokeColor = '#22c55e'; // Green
                        } else if (connectionStart.handle === 'false') {
                            strokeColor = '#ef4444'; // Red
                        }

                        return (
                            <path
                                className="connection-preview"
                                d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                                stroke={strokeColor}
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                fill="none"
                                opacity="0.6"
                                markerEnd="url(#arrowhead-preview)"
                            />
                        );
                    })()}
                </svg>
            </div>

            {/* Empty State */}
            {workflow.nodes.length === 0 && (
                <div className="canvas-empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No nodes yet</h3>
                    <p>Drag nodes from the panel or click "Add Node" to get started</p>
                </div>
            )}

            {/* Controls */}
            <div className="canvas-controls">
                {selectedEdge && (() => {
                    const edge = workflow.edges.find((e) => e.id === selectedEdge);
                    const sourceNode = edge ? workflow.nodes.find((n) => n.id === edge.source) : undefined;

                    return (
                        <div className="edge-controls">
                            <button
                                onClick={() => handleEdgeDelete(selectedEdge)}
                                className="delete-edge-btn"
                                title="Delete Connection"
                            >
                                🗑️ Delete Connection
                            </button>

                            {/* If the source node is a conditional node, allow choosing true/false branch */}
                            {sourceNode && sourceNode.type === 'conditional' && (
                                <div className="branch-controls">
                                    <span className="branch-label">Branch:</span>
                                    <button
                                        className={`branch-btn ${edge?.sourceHandle === 'true' ? 'active' : ''}`}
                                        onClick={() => {
                                            const updatedEdges = workflow.edges.map((ev) =>
                                                ev.id === selectedEdge ? { ...ev, sourceHandle: 'true' } : ev
                                            );
                                            onWorkflowChange?.({ ...workflow, edges: updatedEdges });
                                        }}
                                    >
                                        True
                                    </button>
                                    <button
                                        className={`branch-btn ${edge?.sourceHandle === 'false' ? 'active' : ''}`}
                                        onClick={() => {
                                            const updatedEdges = workflow.edges.map((ev) =>
                                                ev.id === selectedEdge ? { ...ev, sourceHandle: 'false' } : ev
                                            );
                                            onWorkflowChange?.({ ...workflow, edges: updatedEdges });
                                        }}
                                    >
                                        False
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })()}
                <div className="zoom-controls">
                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} title="Zoom Out">
                        −
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} title="Zoom In">
                        +
                    </button>
                    <button
                        onClick={() => {
                            setZoom(1);
                            setPan({ x: 0, y: 0 });
                        }}
                        title="Reset View"
                        className="reset-view-btn"
                    >
                        ⟲
                    </button>
                </div>
            </div>

            {/* Canvas Info Overlay */}
            <div className="canvas-info">
                <div className="info-item">
                    <span className="info-label">Nodes:</span>
                    <span className="info-value">{workflow.nodes.length}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Connections:</span>
                    <span className="info-value">{workflow.edges.length}</span>
                </div>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="canvas-hints">
                <div className="hint-item">
                    <kbd>Space</kbd> + Drag to Pan
                </div>
                <div className="hint-item">
                    <kbd>Scroll</kbd> to Zoom
                </div>
                {selectedEdge && (
                    <div className="hint-item highlight">
                        <kbd>Del</kbd> to Delete Connection
                    </div>
                )}
            </div>
        </div>
    );
};

export default Canvas;
