import React, { useRef, useState, useEffect } from 'react';
import { Workflow, NodeProps, Edge } from '../types';
import WorkflowNode from './WorkflowNode';
import './Canvas.css';

type NodeType = 'webhook' | 'javascript' | 'slack' | 'http' | 'conditional' | 'delay';

type CanvasProps = {
    workflow?: Workflow | null;
    onWorkflowChange?: (workflow: Workflow) => void;
    onNodeSelect?: (nodeId: string) => void;
};

const Canvas: React.FC<CanvasProps> = ({ workflow, onWorkflowChange, onNodeSelect }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<{ nodeId: string; type: 'input' | 'output' } | null>(null);
    const [connectionEnd, setConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Keyboard shortcuts - must be before early return
    useEffect(() => {
        if (!workflow) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedNodeId) {
                    const updatedNodes = workflow.nodes.filter((n) => n.id !== selectedNodeId);
                    const updatedEdges = workflow.edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
                    onWorkflowChange?.({ ...workflow, nodes: updatedNodes, edges: updatedEdges });
                    setSelectedNodeId(null);
                } else if (selectedEdgeId) {
                    const updatedEdges = workflow.edges.filter((e) => e.id !== selectedEdgeId);
                    onWorkflowChange?.({ ...workflow, edges: updatedEdges });
                    setSelectedEdgeId(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, selectedEdgeId, workflow, onWorkflowChange]);

    if (!workflow) {
        return <div className="canvas empty">No workflow loaded</div>;
    }

    const handleNodeSelect = (nodeId: string) => {
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
        onNodeSelect?.(nodeId);
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
    };

    const handleConnectionStart = (nodeId: string, type: 'input' | 'output') => {
        console.log('Connection start:', nodeId, type);
        setIsConnecting(true);
        setConnectionStart({ nodeId, type });
    };

    const handleConnectionEnd = (nodeId: string, type: 'input' | 'output') => {
        console.log('Connection end:', nodeId, type, 'connectionStart:', connectionStart);
        if (!connectionStart || connectionStart.nodeId === nodeId) {
            setIsConnecting(false);
            setConnectionStart(null);
            setConnectionEnd(null);
            return;
        }

        // Determine source and target based on connection direction
        let sourceId = connectionStart.nodeId;
        let targetId = nodeId;

        // If connecting from input to output, swap them
        if (connectionStart.type === 'input' && type === 'output') {
            sourceId = nodeId;
            targetId = connectionStart.nodeId;
        }

        // Check if connection already exists
        const connectionExists = workflow.edges.some(
            (e) => e.source === sourceId && e.target === targetId
        );

        console.log('Creating connection:', sourceId, '->', targetId, 'exists:', connectionExists);

        if (!connectionExists) {
            const newEdge: Edge = {
                id: `edge_${Date.now()}`,
                source: sourceId,
                target: targetId,
            };

            const updated = {
                ...workflow,
                edges: [...workflow.edges, newEdge],
            };

            console.log('Updated workflow with new edge:', updated);
            onWorkflowChange?.(updated);
        }

        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionEnd(null);
    };

    const handleEdgeClick = (edgeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    };

    const handleEdgeDelete = () => {
        if (selectedEdgeId) {
            const updatedEdges = workflow.edges.filter((e) => e.id !== selectedEdgeId);
            const updated = {
                ...workflow,
                edges: updatedEdges,
            };
            onWorkflowChange?.(updated);
            setSelectedEdgeId(null);
        }
    };

    const handleNodeDragStart = (e: React.DragEvent, nodeId: string) => {
        setDraggedNode(nodeId);
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

        const newNode: any = {
            id: `node_${Date.now()}`,
            type: nodeType,
            data: {
                label: `${nodeType} Node`,
                config: {},
            },
            position: { x: Math.max(0, x - 110), y: Math.max(0, y - 50) },
        };

        const updated = {
            ...workflow,
            nodes: [...workflow.nodes, newNode],
        };

        onWorkflowChange?.(updated);
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Middle mouse button or space+left click for panning
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            e.preventDefault();
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y,
            });
            return;
        }

        if (draggedNode && e.buttons === 1) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const node = workflow.nodes.find((n) => n.id === draggedNode);
            if (!node) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;

            const updatedNodes = workflow.nodes.map((n) =>
                n.id === draggedNode ? { ...n, position: { x: Math.max(0, x - 110), y: Math.max(0, y - 50) } } : n
            );

            const updated = {
                ...workflow,
                nodes: updatedNodes,
            };

            onWorkflowChange?.(updated);
        }

        if (isConnecting && connectionStart) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;

            setConnectionEnd({ x, y });
        }
    };

    const handleCanvasMouseUp = (e: React.MouseEvent) => {
        setDraggedNode(null);
        setIsPanning(false);

        // Handle connection completion
        if (isConnecting && connectionStart) {
            // Check if mouse is over a connector
            const target = e.target;
            if (target instanceof HTMLElement && target.classList.contains('node-connector')) {
                // Find which node this connector belongs to
                const nodeElement = target.closest('.workflow-node');
                if (nodeElement) {
                    const nodeId = nodeElement.getAttribute('data-node-id');
                    const isInput = target.classList.contains('input-connector');
                    const isOutput = target.classList.contains('output-connector');

                    if (nodeId && (isInput || isOutput)) {
                        handleConnectionEnd(nodeId, isInput ? 'input' : 'output');
                        return;
                    }
                }
            }

            // If not over a connector, cancel the connection
            console.log('Connection cancelled - not over a connector');
            setIsConnecting(false);
            setConnectionStart(null);
            setConnectionEnd(null);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        const target = e.target;
        if (target === canvasRef.current ||
            (target instanceof HTMLElement && target.classList.contains('canvas-grid'))) {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
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

    const handleResetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div
            className="canvas"
            ref={canvasRef}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={handleCanvasClick}
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
                    pointerEvents: 'none',
                }}
            >
                {/* Connections SVG Layer */}
                <svg
                    className="connections-layer"
                    style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
                >
                    {/* Render existing edges */}
                    {workflow.edges.map((edge) => {
                        const sourceNode = workflow.nodes.find((n) => n.id === edge.source);
                        const targetNode = workflow.nodes.find((n) => n.id === edge.target);

                        if (!sourceNode || !targetNode) return null;

                        const x1 = sourceNode.position.x + 110;
                        const y1 = sourceNode.position.y + 100;
                        const x2 = targetNode.position.x + 110;
                        const y2 = targetNode.position.y;

                        const controlPointOffset = Math.abs(y2 - y1) / 2;

                        return (
                            <g key={edge.id}>
                                <path
                                    className={`connection ${selectedEdgeId === edge.id ? 'selected' : ''}`}
                                    d={`M ${x1} ${y1} C ${x1} ${y1 + controlPointOffset}, ${x2} ${y2 - controlPointOffset}, ${x2} ${y2}`}
                                    onClick={(e) => handleEdgeClick(edge.id, e)}
                                    style={{ cursor: 'pointer' }}
                                />
                                {/* Invisible wider path for easier clicking */}
                                <path
                                    d={`M ${x1} ${y1} C ${x1} ${y1 + controlPointOffset}, ${x2} ${y2 - controlPointOffset}, ${x2} ${y2}`}
                                    stroke="transparent"
                                    strokeWidth="20"
                                    fill="none"
                                    onClick={(e) => handleEdgeClick(edge.id, e)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </g>
                        );
                    })}

                    {/* Render connection being drawn */}
                    {isConnecting && connectionStart && connectionEnd && (() => {
                        const sourceNode = workflow.nodes.find((n) => n.id === connectionStart.nodeId);
                        if (!sourceNode) return null;

                        const x1 = connectionStart.type === 'output'
                            ? sourceNode.position.x + 110
                            : sourceNode.position.x + 110;
                        const y1 = connectionStart.type === 'output'
                            ? sourceNode.position.y + 100
                            : sourceNode.position.y;

                        const x2 = connectionEnd.x;
                        const y2 = connectionEnd.y;

                        const controlPointOffset = Math.abs(y2 - y1) / 2;

                        return (
                            <path
                                className="connection-preview"
                                d={`M ${x1} ${y1} C ${x1} ${y1 + controlPointOffset}, ${x2} ${y2 - controlPointOffset}, ${x2} ${y2}`}
                            />
                        );
                    })()}
                </svg>

                {/* Nodes */}
                <div className="nodes-layer" style={{ pointerEvents: 'auto' }}>
                    {workflow.nodes.map((node) => (
                        <WorkflowNode
                            key={node.id}
                            node={node}
                            isSelected={selectedNodeId === node.id}
                            onSelect={handleNodeSelect}
                            onDelete={handleNodeDelete}
                            onDragStart={handleNodeDragStart}
                            onConnectionStart={handleConnectionStart}
                            onConnectionEnd={handleConnectionEnd}
                        />
                    ))}
                </div>
            </div>

            {/* Empty State */}
            {workflow.nodes.length === 0 && (
                <div className="canvas-empty-state">
                    <div className="empty-icon">🎨</div>
                    <h3>Start Building Your Workflow</h3>
                    <p>Drag nodes from the left panel to begin</p>
                    <p className="hint">💡 Tip: Shift+Click to pan, Scroll to zoom</p>
                </div>
            )}

            {/* Controls */}
            <div className="canvas-controls">
                <div className="zoom-controls">
                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} title="Zoom Out">
                        −
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} title="Zoom In">
                        +
                    </button>
                    <button onClick={handleResetView} title="Reset View" className="reset-btn">
                        ⟲
                    </button>
                </div>
            </div>

            {/* Instructions Overlay */}
            {workflow.nodes.length > 0 && workflow.edges.length === 0 && (
                <div className="canvas-instructions">
                    <p>💡 Drag from the bottom connector of one node to the top connector of another to connect them</p>
                </div>
            )}
        </div>
    );
};

export default Canvas;
