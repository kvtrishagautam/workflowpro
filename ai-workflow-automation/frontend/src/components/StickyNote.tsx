import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StickyNote as StickyNoteType, StickyNoteColor } from '../types';
import './StickyNote.css';

interface StickyNoteProps {
    note: StickyNoteType;
    zoom: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (note: StickyNoteType) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.MouseEvent, id: string) => void;
}

const COLORS: { value: StickyNoteColor; label: string; bg: string }[] = [
    { value: 'yellow', label: 'Yellow', bg: '#fff9c4' },
    { value: 'blue', label: 'Blue', bg: '#bbdefb' },
    { value: 'green', label: 'Green', bg: '#c8e6c9' },
    { value: 'pink', label: 'Pink', bg: '#f8bbd0' },
    { value: 'purple', label: 'Purple', bg: '#e1bee7' },
    { value: 'orange', label: 'Orange', bg: '#ffe0b2' },
];

const getBgColor = (color: StickyNoteColor): string => {
    return COLORS.find((c) => c.value === color)?.bg ?? '#fff9c4';
};

const StickyNote: React.FC<StickyNoteProps> = ({
    note,
    zoom,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onDragStart,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [editContent, setEditContent] = useState(note.content);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const noteRef = useRef<HTMLDivElement>(null);
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

    // Sync editContent when note.content changes externally
    useEffect(() => {
        if (!isEditing) {
            setEditContent(note.content);
        }
    }, [note.content, isEditing]);

    // Auto-focus textarea when editing starts
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    const saveContent = useCallback(() => {
        onUpdate({ ...note, content: editContent });
        setIsEditing(false);
    }, [note, editContent, onUpdate]);

    const cancelEdit = useCallback(() => {
        setEditContent(note.content);
        setIsEditing(false);
    }, [note.content]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing || isResizing) return;
        const target = e.target as HTMLElement;
        if (target.closest('.sticky-note-toolbar') || target.closest('.sticky-note-resize-handle')) return;
        e.stopPropagation();
        onSelect(note.id);
        onDragStart(e, note.id);
    };

    const handleSingleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(note.id);
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: note.size.width,
            height: note.size.height,
        };
        setIsResizing(true);

        const handleMouseMove = (me: MouseEvent) => {
            if (!resizeStartRef.current) return;
            const dx = (me.clientX - resizeStartRef.current.x) / zoom;
            const dy = (me.clientY - resizeStartRef.current.y) / zoom;
            const newWidth = Math.max(150, resizeStartRef.current.width + dx);
            const newHeight = Math.max(100, resizeStartRef.current.height + dy);
            onUpdate({ ...note, size: { width: newWidth, height: newHeight } });
        };

        const handleMouseUp = () => {
            resizeStartRef.current = null;
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            cancelEdit();
        } else if (e.key === 'Enter' && e.ctrlKey) {
            e.stopPropagation();
            saveContent();
        }
    };

    const handleColorChange = (color: StickyNoteColor) => {
        onUpdate({ ...note, color });
        setShowColorPicker(false);
    };

    const currentColor = COLORS.find((c) => c.value === note.color) ?? COLORS[0];

    return (
        <div
            ref={noteRef}
            className={`sticky-note${isSelected ? ' selected' : ''}${isEditing ? ' editing' : ''}`}
            style={{
                left: note.position.x,
                top: note.position.y,
                width: note.size.width,
                height: note.size.height,
                backgroundColor: getBgColor(note.color),
                zIndex: note.zIndex || 0,
            }}
            onMouseDown={handleMouseDown}
            onClick={handleSingleClick}
            onDoubleClick={handleDoubleClick}
        >
            {/* Toolbar */}
            <div className="sticky-note-toolbar" onMouseDown={(e) => e.stopPropagation()}>
                <div className="sticky-note-toolbar-left">
                    <button
                        className="sticky-note-btn color-btn"
                        title="Change color"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowColorPicker((v) => !v);
                        }}
                    >
                        <span
                            className="color-indicator"
                            style={{ backgroundColor: currentColor.bg }}
                        />
                    </button>
                    {showColorPicker && (
                        <div className="sticky-note-color-picker">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    className={`color-option${note.color === c.value ? ' active' : ''}`}
                                    style={{ backgroundColor: c.bg }}
                                    title={c.label}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleColorChange(c.value);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <button
                    className="sticky-note-btn delete-btn"
                    title="Delete note"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                    }}
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div className="sticky-note-content">
                {isEditing ? (
                    <textarea
                        ref={textareaRef}
                        className="sticky-note-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onBlur={saveContent}
                        onKeyDown={handleTextareaKeyDown}
                        placeholder="Type a note..."
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="sticky-note-text">
                        {note.content || <span className="sticky-note-placeholder">Double-click to edit…</span>}
                    </div>
                )}
            </div>

            {/* Resize handle */}
            <div
                className="sticky-note-resize-handle"
                onMouseDown={handleResizeMouseDown}
            />
        </div>
    );
};

export default StickyNote;
