import React, { useMemo } from 'react';
import { Workflow, StickyNoteColor } from '../types';
import './MiniMap.css';

interface MiniMapProps {
    workflow: Workflow;
    zoom: number;
    pan: { x: number; y: number };
    canvasSize: { width: number; height: number };
    onPanChange: (pan: { x: number; y: number }) => void;
}

const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const PADDING = 20;
const NODE_DEFAULT_W = 220;
const NODE_DEFAULT_H = 100;

const MiniMap: React.FC<MiniMapProps> = ({ workflow, zoom, pan, canvasSize, onPanChange }) => {
    const { nodes, edges, stickyNotes = [] } = workflow;

    const bounds = useMemo(() => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        nodes.forEach((n) => {
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
            maxX = Math.max(maxX, n.position.x + NODE_DEFAULT_W);
            maxY = Math.max(maxY, n.position.y + NODE_DEFAULT_H);
        });

        stickyNotes.forEach((s) => {
            minX = Math.min(minX, s.position.x);
            minY = Math.min(minY, s.position.y);
            maxX = Math.max(maxX, s.position.x + s.size.width);
            maxY = Math.max(maxY, s.position.y + s.size.height);
        });

        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
        }

        minX -= PADDING;
        minY -= PADDING;
        maxX += PADDING;
        maxY += PADDING;

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }, [nodes, stickyNotes]);

    const scale = useMemo(() => {
        const s = Math.min(
            MINIMAP_WIDTH / bounds.width,
            MINIMAP_HEIGHT / bounds.height,
            0.15
        );
        return s;
    }, [bounds]);

    const viewport = useMemo(() => {
        const viewX = -pan.x / zoom - bounds.minX;
        const viewY = -pan.y / zoom - bounds.minY;
        const viewW = canvasSize.width / zoom;
        const viewH = canvasSize.height / zoom;
        return {
            x: viewX * scale,
            y: viewY * scale,
            width: Math.max(8, viewW * scale),
            height: Math.max(6, viewH * scale),
        };
    }, [pan, zoom, canvasSize, bounds, scale]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.querySelector<HTMLDivElement>('.minimap-content')?.getBoundingClientRect();
        if (!rect) return;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const worldX = clickX / scale + bounds.minX;
        const worldY = clickY / scale + bounds.minY;
        const newPanX = -(worldX - canvasSize.width / (2 * zoom)) * zoom;
        const newPanY = -(worldY - canvasSize.height / (2 * zoom)) * zoom;
        onPanChange({ x: newPanX, y: newPanY });
    };

    const renderNodes = () =>
        nodes.map((n) => {
            const x = (n.position.x - bounds.minX) * scale;
            const y = (n.position.y - bounds.minY) * scale;
            const w = Math.max(4, NODE_DEFAULT_W * scale);
            const h = Math.max(3, NODE_DEFAULT_H * scale);
            return (
                <div
                    key={n.id}
                    className="minimap-node"
                    style={{ left: x, top: y, width: w, height: h }}
                />
            );
        });

    const renderStickyNotes = () =>
        stickyNotes.map((s) => {
            const x = (s.position.x - bounds.minX) * scale;
            const y = (s.position.y - bounds.minY) * scale;
            const w = Math.max(4, s.size.width * scale);
            const h = Math.max(3, s.size.height * scale);
            const colorClass: Record<StickyNoteColor, string> = {
                yellow: 'minimap-sticky-yellow',
                blue: 'minimap-sticky-blue',
                green: 'minimap-sticky-green',
                pink: 'minimap-sticky-pink',
                purple: 'minimap-sticky-purple',
                orange: 'minimap-sticky-orange',
            };
            return (
                <div
                    key={s.id}
                    className={`minimap-sticky-note ${colorClass[s.color]}`}
                    style={{ left: x, top: y, width: w, height: h }}
                />
            );
        });

    const renderConnections = () =>
        edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const tgt = nodes.find((n) => n.id === edge.target);
            if (!src || !tgt) return null;
            const x1 = (src.position.x - bounds.minX + NODE_DEFAULT_W / 2) * scale;
            const y1 = (src.position.y - bounds.minY + NODE_DEFAULT_H) * scale;
            const x2 = (tgt.position.x - bounds.minX + NODE_DEFAULT_W / 2) * scale;
            const y2 = (tgt.position.y - bounds.minY) * scale;
            return (
                <line
                    key={edge.id}
                    className="minimap-edge"
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                />
            );
        });

    if (nodes.length === 0 && stickyNotes.length === 0) return null;

    return (
        <div className="minimap" onClick={handleClick}>
            <div className="minimap-header">Overview</div>
            <div className="minimap-content">
                {renderStickyNotes()}
                <svg className="minimap-connections">
                    {renderConnections()}
                </svg>
                {renderNodes()}
                <div
                    className="minimap-viewport"
                    style={{
                        left: Math.max(0, viewport.x),
                        top: Math.max(0, viewport.y),
                        width: viewport.width,
                        height: viewport.height,
                    }}
                />
            </div>
        </div>
    );
};

export default MiniMap;
