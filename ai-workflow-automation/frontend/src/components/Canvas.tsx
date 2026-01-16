import React, { useRef, useState } from 'react';
import { Workflow, Edge } from '../types';
import WorkflowNode from './WorkflowNode';
import './Canvas.css';



type CanvasProps = {
    workflow?: Workflow | null;
    onWorkflowChange?: (workflow: Workflow) => void;
    onNodeSelect?: (nodeId: string | null) => void;
    selectedNodeId?: string | null;
};

const Canvas: React.FC<CanvasProps> = ({ workflow, onWorkflowChange, onNodeSelect, selectedNodeId }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<string | null>(null);
    const [connectionEnd, setConnectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    if (!workflow) {
        return <div className="canvas empty">No workflow loaded</div>;
    }

    const handleNodeSelect = (nodeId: string) => {
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
        onNodeSelect?.(null);
    };

    const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
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
        let x = (e.clientX - rect.left - pan.x) / zoom;
        let y = (e.clientY - rect.top - pan.y) / zoom;

        // Grid snapping (snap to 20px grid)
        const gridSize = 20;
        x = Math.round(x / gridSize) * gridSize;
        y = Math.round(y / gridSize) * gridSize;

        // Collision detection - check if position overlaps with existing nodes
        const nodeWidth = 220;
        const nodeHeight = 100;
        const minSpacing = 40; // Minimum spacing between nodes

        const hasCollision = (testX: number, testY: number): boolean => {
            return workflow.nodes.some(node => {
                const dx = Math.abs(node.position.x - testX);
                const dy = Math.abs(node.position.y - testY);
                return dx < (nodeWidth + minSpacing) && dy < (nodeHeight + minSpacing);
            });
        };

        // If there's a collision, find the next available position
        if (hasCollision(x, y)) {
            // Try positions in a spiral pattern around the drop point
            let found = false;
            const maxAttempts = 50;
            let attempt = 0;
            let offsetX = nodeWidth + minSpacing;
            let offsetY = nodeHeight + minSpacing;

            // First try horizontal positions
            for (let i = 1; i <= 5 && !found; i++) {
                const testX = x + (offsetX * i);
                if (!hasCollision(testX, y)) {
                    x = testX;
                    found = true;
                }
            }

            // Then try vertical positions
            if (!found) {
                for (let i = 1; i <= 5 && !found; i++) {
                    const testY = y + (offsetY * i);
                    if (!hasCollision(x, testY)) {
                        y = testY;
                        found = true;
                    }
                }
            }

            // Finally try a grid pattern
            if (!found) {
                for (let row = 0; row < 5 && !found; row++) {
                    for (let col = 0; col < 5 && !found; col++) {
                        const testX = x + (offsetX * col);
                        const testY = y + (offsetY * row);
                        if (!hasCollision(testX, testY)) {
                            x = testX;
                            y = testY;
                            found = true;
                        }
                    }
                }
            }
        }

        const newNode: any = {
            id: `node_${Date.now()}`,
            type: nodeType,
            data: {
                label: `${nodeType} Node`,
                config: {},
            },
            position: { x: Math.max(0, x), y: Math.max(0, y) },
        };

        const updated = {
            ...workflow,
            nodes: [...workflow.nodes, newNode],
        };

        onWorkflowChange?.(updated);
    };

    const handleConnectStart = (nodeId: string) => {
        setIsConnecting(true);
        setConnectionStart(nodeId);

        // Initial position for the preview line
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (node) {
            setConnectionEnd({
                x: node.position.x + 110,
                y: node.position.y + 100
            });
        }
    };

    const handleConnectEnd = (targetNodeId: string) => {
        if (isConnecting && connectionStart && connectionStart !== targetNodeId) {
            // Create a new edge
            const newEdge: Edge = {
                id: `edge_${Date.now()}`,
                source: connectionStart,
                target: targetNodeId,
            };

            // Check if edge already exists to avoid duplicates
            const edgeExists = workflow.edges.some(
                e => e.source === connectionStart && e.target === targetNodeId
            );

            if (!edgeExists) {
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

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (draggedNode && e.buttons === 1) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;

            // No grid snapping during drag for smooth movement
            // Grid snapping will happen on drop instead

            const updatedNodes = workflow.nodes.map((n) =>
                n.id === draggedNode ? { ...n, position: { x: Math.max(0, x), y: Math.max(0, y) } } : n
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

    const handleCanvasMouseUp = () => {
        if (draggedNode) {
            // Snap to grid when drag ends for clean positioning
            const gridSize = 20;
            const draggedNodeData = workflow.nodes.find(n => n.id === draggedNode);

            if (draggedNodeData) {
                const snappedX = Math.round(draggedNodeData.position.x / gridSize) * gridSize;
                const snappedY = Math.round(draggedNodeData.position.y / gridSize) * gridSize;

                const updatedNodes = workflow.nodes.map((n) =>
                    n.id === draggedNode
                        ? { ...n, position: { x: Math.max(0, snappedX), y: Math.max(0, snappedY) } }
                        : n
                );

                const updated = {
                    ...workflow,
                    nodes: updatedNodes,
                };

                onWorkflowChange?.(updated);
            }

            setDraggedNode(null);
        }

        // Important: we don't clear isConnecting here because handleConnectEnd 
        // will be triggered on the target node if the mouse is released over it.
        // However, if we release over empty space, we should clear it.
        // Accomplished by giving the canvas a mouseUp too.
        setTimeout(() => {
            if (isConnecting) {
                setIsConnecting(false);
                setConnectionStart(null);
                setConnectionEnd(null);
            }
        }, 100);
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

    const handleAutoLayout = () => {
        if (workflow.nodes.length === 0) return;

        const nodeWidth = 220;
        const nodeHeight = 120;
        const horizontalSpacing = 100;
        const verticalSpacing = 80;
        const nodesPerRow = 3;
        const startX = 50;
        const startY = 50;

        const updatedNodes = workflow.nodes.map((node, index) => {
            const row = Math.floor(index / nodesPerRow);
            const col = index % nodesPerRow;

            return {
                ...node,
                position: {
                    x: startX + (col * (nodeWidth + horizontalSpacing)),
                    y: startY + (row * (nodeHeight + verticalSpacing))
                }
            };
        });

        const updated = {
            ...workflow,
            nodes: updatedNodes,
        };

        onWorkflowChange?.(updated);
    };

    return (
        <div
            className="canvas"
            ref={canvasRef}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
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
                    pointerEvents: 'none',
                }}
            >
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
                            onConnectStart={handleConnectStart}
                            onConnectEnd={handleConnectEnd}
                        />
                    ))}
                </div>

                {/* Connections SVG Layer */}
                <svg
                    className="connections-layer"
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
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

                        return (
                            <path
                                key={edge.id}
                                className="connection"
                                d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                            />
                        );
                    })}

                    {/* Render connection being drawn */}
                    {isConnecting && connectionStart && connectionEnd && (
                        <path
                            className="connection-preview"
                            d={`M ${(() => {
                                const node = workflow.nodes.find(n => n.id === connectionStart);
                                return node ? node.position.x + 110 : 0;
                            })()} ${(() => {
                                const node = workflow.nodes.find(n => n.id === connectionStart);
                                return node ? node.position.y + 100 : 0;
                            })()} L ${connectionEnd.x} ${connectionEnd.y}`}
                            stroke="#8B5CF6"
                            strokeWidth="3"
                            strokeDasharray="5,5"
                        />
                    )}
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
                <div className="zoom-controls">
                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} title="Zoom Out">
                        −
                    </button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} title="Zoom In">
                        +
                    </button>
                </div>
                <button
                    className="auto-layout-btn"
                    onClick={handleAutoLayout}
                    title="Auto-organize nodes in a grid"
                    disabled={workflow.nodes.length === 0}
                >
                    ⚡ Auto Layout
                </button>
            </div>
        </div>
    );
};

export default Canvas;
