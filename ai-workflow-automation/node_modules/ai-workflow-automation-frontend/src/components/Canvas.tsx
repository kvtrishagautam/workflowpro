import React, { useRef, useState, useEffect } from 'react';
import { Workflow, NodeProps, Edge } from '../types';
import WorkflowNode from './WorkflowNode';
import './Canvas.css';

type NodeType = 'webhook' | 'javascript' | 'slack' | 'http' | 'conditional' | 'delay';

type CanvasProps = {
    workflow?: Workflow | null;
    onWorkflowChange?: (workflow: Workflow) => void;
};

const Canvas: React.FC<CanvasProps> = ({ workflow, onWorkflowChange }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
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
        setSelectedNodeId(nodeId);
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
            position: { x: Math.max(0, x), y: Math.max(0, y) },
        };

        const updated = {
            ...workflow,
            nodes: [...workflow.nodes, newNode],
        };

        onWorkflowChange?.(updated);
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
        if (draggedNode && e.buttons === 1) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const node = workflow.nodes.find((n) => n.id === draggedNode);
            if (!node) return;

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - pan.x) / zoom;
            const y = (e.clientY - rect.top - pan.y) / zoom;

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
        setDraggedNode(null);
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectionEnd(null);
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
                            d={`M ${connectionEnd.x} ${connectionEnd.y} L ${connectionEnd.x} ${connectionEnd.y}`}
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
            </div>
        </div>
    );
};

export default Canvas;
