# Sticky Notes & MiniMap — Full Integration Plan

> **Purpose:** This document provides a step-by-step, copy-ready integration plan for adding **Sticky Notes** and a **MiniMap** to a workflow-editor canvas. It includes every type definition, component, CSS file, state variable, handler, keyboard shortcut, and JSX insertion point needed to replicate the feature in a different folder/project that shares the same architecture.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Assumptions](#2-prerequisites--assumptions)
3. [Step 1 — Type Definitions](#step-1--type-definitions)
4. [Step 2 — StickyNote Component](#step-2--stickynote-component)
5. [Step 3 — StickyNote CSS](#step-3--stickynote-css)
6. [Step 4 — MiniMap Component](#step-4--minimap-component)
7. [Step 5 — MiniMap CSS](#step-5--minimap-css)
8. [Step 6 — Canvas Integration](#step-6--canvas-integration)
9. [Step 7 — Canvas CSS Additions](#step-7--canvas-css-additions)
10. [Step 8 — Editor / Page-Level Integration](#step-8--editor--page-level-integration)
11. [Step 9 — Keyboard Shortcuts](#step-9--keyboard-shortcuts)
12. [Step 10 — Backend / Persistence](#step-10--backend--persistence)
13. [File Checklist](#file-checklist)
14. [Testing Checklist](#testing-checklist)

---

## 1. Architecture Overview

```
types/index.ts          ← StickyNote & StickyNoteColor type definitions
                          Workflow.stickyNotes optional array

components/
  StickyNote.tsx        ← Individual sticky note (drag, resize, edit, color, delete)
  StickyNote.css        ← Styling for notes, toolbar, color picker, resize handle
  MiniMap.tsx           ← Canvas overview widget (nodes, notes, edges, viewport rect)
  MiniMap.css           ← Styling for minimap, node dots, sticky note spots, viewport
  Canvas.tsx            ← Hosts both components; owns all state & handlers
  Canvas.css            ← Layer CSS (sticky-notes-layer, add-sticky-note button)

pages/
  Editor.tsx            ← Initialises empty stickyNotes array in workflow state
```

**Data flow:**  
`Editor` owns `workflow` state → passes to `Canvas` → `Canvas` renders `StickyNote[]` and `MiniMap`, handles create/update/delete/drag/resize → calls `onWorkflowChange` to propagate back.

---

## 2. Prerequisites & Assumptions

| Requirement | Detail |
|---|---|
| React 18+ | Uses `useCallback`, `useRef`, `useMemo`, `useEffect` |
| TypeScript | All code is `.tsx` / `.ts` |
| Existing Canvas | Already has `zoom`, `pan`, `canvasRef`, `onWorkflowChange` prop |
| Existing Workflow type | Has `nodes: NodeProps[]` and `edges: Edge[]` |
| CSS approach | Plain CSS files imported per component (no CSS modules) |

---

## Step 1 — Type Definitions

**File:** `types/index.ts` (or wherever your shared types live)

### 1a. Add `StickyNoteColor` type

```ts
export type StickyNoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
```

### 1b. Add `StickyNote` interface

```ts
export interface StickyNote {
    id: string;
    content: string;
    position: { x: number; y: number };   // reuse NodePosition if available
    size: {
        width: number;
        height: number;
    };
    color: StickyNoteColor;
    zIndex?: number;
}
```

### 1c. Extend the `Workflow` / `WorkflowProps` interface

Add an **optional** `stickyNotes` field so existing workflows remain compatible:

```ts
export interface WorkflowProps {
    id: string;
    name: string;
    description?: string;
    nodes: NodeProps[];
    edges: Edge[];
    stickyNotes?: StickyNote[];   // ← ADD THIS
    createdAt?: string;
    updatedAt?: string;
}
```

---

## Step 2 — StickyNote Component

**File to create:** `components/StickyNote.tsx`

### Props Interface

```ts
interface StickyNoteProps {
    note: StickyNoteType;        // the StickyNote data type (imported & aliased)
    zoom: number;                // current canvas zoom (needed for resize delta calc)
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (note: StickyNoteType) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.MouseEvent, id: string) => void;
}
```

### Color palette constant

```ts
const COLORS: { value: StickyNoteColor; label: string; bg: string }[] = [
    { value: 'yellow',  label: 'Yellow',  bg: '#fff9c4' },
    { value: 'blue',    label: 'Blue',    bg: '#bbdefb' },
    { value: 'green',   label: 'Green',   bg: '#c8e6c9' },
    { value: 'pink',    label: 'Pink',    bg: '#f8bbd0' },
    { value: 'purple',  label: 'Purple',  bg: '#e1bee7' },
    { value: 'orange',  label: 'Orange',  bg: '#ffe0b2' },
];
```

### Internal state

| State | Type | Purpose |
|---|---|---|
| `isEditing` | `boolean` | Whether the note text is being edited |
| `isResizing` | `boolean` | Whether the note is being resized |
| `showColorPicker` | `boolean` | Toggle for color palette dropdown |
| `editContent` | `string` | Local textarea value |

### Refs

| Ref | Type | Purpose |
|---|---|---|
| `textareaRef` | `HTMLTextAreaElement` | Auto-focus when editing starts |
| `noteRef` | `HTMLDivElement` | Note container |
| `resizeStartRef` | `{ x, y, width, height } \| null` | Tracks resize start metrics |

### Key Behaviors

1. **Single click** → select note (`onSelect`)
2. **Double click** → enter edit mode (set `isEditing = true`, focus textarea)
3. **Mouse down** (not editing, not resizing, not on toolbar) → start drag (`onDragStart`)
4. **Resize handle mousedown** → attach document-level `mousemove`/`mouseup` listeners; compute delta divided by `zoom`; enforce min width 150px, min height 100px; call `onUpdate` with new size
5. **Color change** → call `onUpdate` with new color
6. **Delete** → call `onDelete`
7. **Blur / Ctrl+Enter** → save content; **Escape** → cancel edit, reset content

### JSX structure

```
<div.sticky-note>
  <div.sticky-note-toolbar>       ← color button + delete button
    {showColorPicker && <div.sticky-note-color-picker> ... </div>}
  </div>
  <div.sticky-note-content>
    {isEditing ? <textarea> : <div.sticky-note-text>}
  </div>
  <div.sticky-note-resize-handle onMouseDown={handleResizeStart} />
</div>
```

### Inline styles applied to root div

```ts
style={{
    left: note.position.x,
    top: note.position.y,
    width: note.size.width,
    height: note.size.height,
    backgroundColor: getBgColor(),   // look up from COLORS array
    zIndex: note.zIndex || 0,
}}
```

---

## Step 3 — StickyNote CSS

**File to create:** `components/StickyNote.css`

### Key selectors & rules

| Selector | Key Properties |
|---|---|
| `.sticky-note` | `position: absolute`, `border-radius: 4px`, `box-shadow`, `cursor: grab`, `user-select: none`, `display: flex; flex-direction: column`, `min-width: 150px; min-height: 100px`, `border: 2px solid transparent`, `pointer-events: auto` |
| `.sticky-note:hover` | Stronger box-shadow |
| `.sticky-note.selected` | `border-color: #667eea`, purple glow shadow |
| `.sticky-note.editing` | `cursor: auto` |
| `.sticky-note-toolbar` | `display: flex; justify-content: space-between`, `opacity: 0` (shown on hover/selected), `background: rgba(0,0,0,0.05)`, `border-radius: 4px 4px 0 0` |
| `.sticky-note-btn` | 22×22px, transparent bg, flex center |
| `.color-indicator` | 14×14px rounded square border |
| `.delete-btn` | red `×` |
| `.sticky-note-color-picker` | `position: absolute; top: 30px; left: 6px`, white bg, row of color circles, `z-index: 1000` |
| `.color-option` | 24×24px, active = `border-color: #667eea` |
| `.sticky-note-content` | `flex: 1; padding: 8px 10px; overflow: hidden` |
| `.sticky-note-text` | `font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word` |
| `.sticky-note-textarea` | full size, no border, transparent bg, no resize, same font |
| `.sticky-note-resize-handle` | `position: absolute; right: 0; bottom: 0`, 16×16px, diagonal gradient, `cursor: nwse-resize`, `opacity: 0` (shown on hover/selected) |

### Add Sticky Note FAB button (in StickyNote.css or Canvas.css)

| Selector | Key Properties |
|---|---|
| `.add-sticky-note-btn` | `position: absolute; bottom: 100px; right: 20px`, 50×50px circle, yellow/orange gradient bg, `z-index: 100` |
| `.add-sticky-note-btn:hover` | `transform: scale(1.1)` |
| `.add-sticky-note-btn .tooltip` | Positioned left of button, dark bg, `opacity: 0` → `1` on hover |

---

## Step 4 — MiniMap Component

**File to create:** `components/MiniMap.tsx`

### Props Interface

```ts
interface MiniMapProps {
    workflow: Workflow;
    zoom: number;
    pan: { x: number; y: number };
    canvasSize: { width: number; height: number };
    onPanChange: (pan: { x: number; y: number }) => void;
}
```

### Constants

```ts
const MINIMAP_WIDTH  = 180;
const MINIMAP_HEIGHT = 120;
const PADDING        = 20;
```

### Computed values (all `useMemo`)

| Value | Logic |
|---|---|
| `bounds` | Iterate all `workflow.nodes` and `workflow.stickyNotes`, find min/max x/y (node width assumed 220, height 100; sticky uses `note.size`), add `PADDING` |
| `scale` | `Math.min(MINIMAP_WIDTH / bounds.width, MINIMAP_HEIGHT / bounds.height, 0.15)` — cap at 15% |
| `viewport` | Visible rect in minimap space: `viewX = -pan.x / zoom`, etc., translated by `bounds.minX`, scaled by `scale` |

### Click-to-navigate

On click anywhere in minimap:
1. Get click position relative to minimap element
2. Convert to world coords: `worldX = clickX / scale + bounds.minX`
3. Center viewport on that point: `newPanX = -(worldX - canvasSize.width / (2 * zoom)) * zoom`
4. Call `onPanChange({ x: newPanX, y: newPanY })`

### Render functions

| Function | What it renders |
|---|---|
| `renderNodes()` | Tiny rectangles (`div.minimap-node`) at scaled positions (min 4×3 px) |
| `renderStickyNotes()` | Tiny colored rectangles (`div.minimap-sticky-note.minimap-sticky-{color}`) |
| `renderConnections()` | SVG `<line>` elements between source/target node centers (`line.minimap-edge`) |

### JSX structure

```
<div.minimap onClick={handleClick}>
  <div.minimap-header> "Overview" </div>
  <div.minimap-content>
    {renderStickyNotes()}                        ← behind
    <svg.minimap-connections>{renderConnections()}</svg>
    {renderNodes()}
    <div.minimap-viewport style={...} />         ← viewport indicator rect
  </div>
</div>
```

The component returns `null` if `workflow.nodes.length === 0`.

---

## Step 5 — MiniMap CSS

**File to create:** `components/MiniMap.css`

### Key selectors & rules

| Selector | Key Properties |
|---|---|
| `.minimap` | `position: absolute; top: 20px; right: 20px; width: 180px`, dark bg `rgba(15,23,42,0.95)`, `border-radius: 8px`, `z-index: 100`, `cursor: pointer` |
| `.minimap:hover` | `transform: scale(1.02)`, deeper shadow |
| `.minimap-header` | `padding: 6px 10px`, purple tint bg, uppercase 11px text `#a78bfa` |
| `.minimap-content` | `position: relative; height: 120px`, dark semi-transparent bg |
| `.minimap-node` | `position: absolute`, purple gradient bg, `border-radius: 2px` |
| `.minimap-sticky-note` | `position: absolute; border-radius: 1px; opacity: 0.6` |
| `.minimap-sticky-yellow` | `background: #fff9c4` |
| `.minimap-sticky-blue` | `background: #bbdefb` |
| `.minimap-sticky-green` | `background: #c8e6c9` |
| `.minimap-sticky-pink` | `background: #f8bbd0` |
| `.minimap-sticky-purple` | `background: #e1bee7` |
| `.minimap-sticky-orange` | `background: #ffe0b2` |
| `.minimap-connections` | `position: absolute; width/height: 100%; pointer-events: none` |
| `.minimap-edge` | `stroke: rgba(124,58,237,0.4); stroke-width: 1` |
| `.minimap-viewport` | `border: 2px solid #60a5fa; background: rgba(96,165,250,0.1); pointer-events: none; box-shadow: 0 0 8px rgba(96,165,250,0.4)` |
| `@media (max-width: 768px)` | `.minimap { display: none }` |

---

## Step 6 — Canvas Integration

**File to modify:** `components/Canvas.tsx`

### 6a. Imports

Add at the top of the file:

```ts
import { Workflow, NodeProps, StickyNote as StickyNoteType } from '../types';
import StickyNote from './StickyNote';
import MiniMap from './MiniMap';
```

### 6b. State variables to add

```ts
// Sticky notes selection & drag state
const [selectedStickyNoteId, setSelectedStickyNoteId] = useState<string | null>(null);
const [draggedStickyNote, setDraggedStickyNote] = useState<string | null>(null);
const [stickyNoteOffset, setStickyNoteOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
```

### 6c. Refs for keyboard-accessible handlers

```ts
const handleStickyNoteDeleteRef = useRef<(noteId: string) => void>(() => {});
const addStickyNoteRef = useRef<() => void>(() => {});
```

### 6d. Handler functions to add

#### `addStickyNote` (useCallback)
Creates a new `StickyNoteType` at the center of the visible canvas area:
- Calculate center: `x = (rect.width / 2 - pan.x) / zoom - 100`, `y = (rect.height / 2 - pan.y) / zoom - 75`
- Default properties: `id: 'sticky_' + Date.now()`, `content: ''`, `size: { width: 200, height: 150 }`, `color: 'yellow'`, `zIndex: stickyNotes.length + 1`
- Append to `workflow.stickyNotes`, call `onWorkflowChange`, set `selectedStickyNoteId`

#### `handleStickyNoteSelect`
```ts
const handleStickyNoteSelect = (noteId: string) => {
    setSelectedStickyNoteId(noteId);
    setSelectedNodeId(null);
    setSelectedEdge(null);
};
```

#### `handleStickyNoteUpdate`
```ts
const handleStickyNoteUpdate = (updatedNote: StickyNoteType) => {
    const updatedNotes = (workflow.stickyNotes || []).map((n) =>
        n.id === updatedNote.id ? updatedNote : n
    );
    onWorkflowChange?.({ ...workflow, stickyNotes: updatedNotes });
};
```

#### `handleStickyNoteDelete`
```ts
const handleStickyNoteDelete = (noteId: string) => {
    const updatedNotes = (workflow.stickyNotes || []).filter((n) => n.id !== noteId);
    onWorkflowChange?.({ ...workflow, stickyNotes: updatedNotes });
    setSelectedStickyNoteId(null);
};
```

#### `handleStickyNoteDragStart`
```ts
const handleStickyNoteDragStart = (e: React.MouseEvent, noteId: string) => {
    const note = workflow.stickyNotes?.find((n) => n.id === noteId);
    if (!note) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    setDraggedStickyNote(noteId);
    setStickyNoteOffset({
        x: mouseX - note.position.x,
        y: mouseY - note.position.y,
    });
};
```

### 6e. Modify `handleCanvasMouseMove`

Add **before** the existing node-drag block:

```ts
// Handle sticky note dragging
if (draggedStickyNote && e.buttons === 1 && !spacePressedRef.current) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    const updatedNotes = (workflow.stickyNotes || []).map((n) =>
        n.id === draggedStickyNote
            ? {
                ...n,
                position: {
                    x: Math.max(0, mouseX - stickyNoteOffset.x),
                    y: Math.max(0, mouseY - stickyNoteOffset.y),
                },
            }
            : n
    );

    onWorkflowChange?.({ ...workflow, stickyNotes: updatedNotes });
}
```

### 6f. Modify `handleCanvasMouseUp`

Add `setDraggedStickyNote(null)` alongside existing `setDraggedNode(null)`.

### 6g. Modify `handleCanvasMouseDown`

Add `setSelectedStickyNoteId(null)` in the "click on empty canvas" deselect block alongside existing deselections.

### 6h. JSX additions inside the `return`

#### Sticky Notes layer (inside `<div className="canvas-content">`, BEFORE the nodes layer)

```tsx
{/* Sticky Notes Layer (behind nodes) */}
<div className="sticky-notes-layer">
    {(workflow.stickyNotes || []).map((note) => (
        <StickyNote
            key={note.id}
            note={note}
            zoom={zoom}
            isSelected={selectedStickyNoteId === note.id}
            onSelect={handleStickyNoteSelect}
            onUpdate={handleStickyNoteUpdate}
            onDelete={handleStickyNoteDelete}
            onDragStart={handleStickyNoteDragStart}
        />
    ))}
</div>
```

#### Add Sticky Note button (outside `canvas-content`, directly in `.canvas`)

```tsx
{/* Add Sticky Note Button */}
<button
    className="add-sticky-note-btn"
    onClick={addStickyNote}
    title="Add Sticky Note (Shift+S)"
>
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
    <span className="tooltip">Add Sticky Note <kbd>Shift+S</kbd></span>
</button>
```

#### MiniMap (outside `canvas-content`, directly in `.canvas`)

```tsx
{/* MiniMap for workflow navigation */}
<MiniMap
    workflow={workflow}
    zoom={zoom}
    pan={pan}
    canvasSize={{
        width: canvasRef.current?.clientWidth || 800,
        height: canvasRef.current?.clientHeight || 600,
    }}
    onPanChange={setPan}
/>
```

#### Canvas info overlay — add notes count

```tsx
{(workflow.stickyNotes?.length || 0) > 0 && (
    <div className="info-item">
        <span className="info-label">Notes:</span>
        <span className="info-value">{workflow.stickyNotes?.length || 0}</span>
    </div>
)}
```

#### Canvas keyboard hints — add sticky note hint

```tsx
<div className="hint-item">
    <kbd>Shift+S</kbd> Sticky Note
</div>
{selectedStickyNoteId && (
    <div className="hint-item highlight">
        <kbd>Del</kbd> to Delete Note
    </div>
)}
```

---

## Step 7 — Canvas CSS Additions

**File to modify:** `components/Canvas.css`

Add these layers:

```css
/* Layers */
.sticky-notes-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
}

.sticky-notes-layer .sticky-note {
    pointer-events: auto;
}
```

Add the FAB button styles (if not in `StickyNote.css`):

```css
.add-sticky-note-btn {
    position: absolute;
    bottom: 100px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #ffd93d, #ffb347);
    box-shadow: 0 4px 12px rgba(255, 179, 71, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    z-index: 100;
}

.add-sticky-note-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(255, 179, 71, 0.5);
}

.add-sticky-note-btn svg {
    width: 24px;
    height: 24px;
    fill: #333;
}

.add-sticky-note-btn .tooltip {
    position: absolute;
    right: 60px;
    background: #1e293b;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.add-sticky-note-btn .tooltip kbd {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 6px;
    font-family: inherit;
}

.add-sticky-note-btn:hover .tooltip {
    opacity: 1;
}
```

Responsive override (inside `@media (max-width: 768px)`):

```css
.add-sticky-note-btn {
    width: 42px;
    height: 42px;
    bottom: 70px;
    right: 15px;
}
```

---

## Step 8 — Editor / Page-Level Integration

**File to modify:** `pages/Editor.tsx`

### 8a. Ensure `stickyNotes` is in the initial workflow state

In the default `workflow` state initialization, the `stickyNotes` field does NOT need to be explicitly listed since it's optional, but it's good practice to include an empty array:

```ts
const [workflow, setWorkflow] = useState<Workflow>({
    id: `workflow_${Date.now()}`,
    name: 'New Workflow',
    description: '',
    nodes: [],
    edges: [],
    stickyNotes: [],    // ← ADD THIS for clean initialization
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});
```

### 8b. No further changes needed

The `handleWorkflowChange` function in the Editor already spreads the full workflow object, so `stickyNotes` will be preserved through all updates:

```ts
const handleWorkflowChange = (updatedWorkflow: Workflow) => {
    setWorkflow({
        ...updatedWorkflow,
        updatedAt: new Date().toISOString(),
    });
};
```

Canvas already receives the full workflow and calls `onWorkflowChange` with the updated array—no extra plumbing needed at the Editor level.

---

## Step 9 — Keyboard Shortcuts

All keyboard shortcuts are wired in the Canvas component's `useEffect`:

| Shortcut | Action | Guard |
|---|---|---|
| `Shift + S` | Add a new sticky note at the center of the viewport | Not typing in input/textarea |
| `Delete` / `Backspace` | Delete selected sticky note (only if no edge or node is selected) | Not typing in input/textarea |
| `Escape` (inside sticky textarea) | Cancel edit, revert content | Only when editing a sticky note |
| `Ctrl + Enter` (inside sticky textarea) | Save content and exit edit mode | Only when editing a sticky note |

### Implementation in the `useEffect` keydown handler

```ts
// Shift+S to add a sticky note
if (e.key === 'S' && e.shiftKey && !e.ctrlKey && !e.altKey && !isTyping) {
    e.preventDefault();
    addStickyNoteRef.current();
}

// Delete selected sticky note
if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
    if (selectedStickyNoteId && !selectedEdge && !selectedNodeId) {
        e.preventDefault();
        handleStickyNoteDeleteRef.current(selectedStickyNoteId);
    }
}
```

> **Important:** Use `useRef` to store handler references so the `useEffect` closure always calls the latest handler without needing to add handlers to the dependency array, which would cause constant re-registration.

The dependency array for this useEffect should include: `[selectedEdge, selectedStickyNoteId, selectedNodeId]`

---

## Step 10 — Backend / Persistence

If your backend stores/loads workflows, update the workflow schema to include `stickyNotes`.

### 10a. Backend Workflow type (`backend/src/types/workflow.ts`)

Add to the workflow interface:

```ts
stickyNotes?: Array<{
    id: string;
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
    zIndex?: number;
}>;
```

### 10b. Workflow converter (`services/workflowConverter.ts`)

If you have a `toBackendWorkflow` / `toFrontendWorkflow` converter, ensure `stickyNotes` is mapped through:

```ts
// In toBackendWorkflow:
stickyNotes: frontendWorkflow.stickyNotes || [],

// In toFrontendWorkflow:
stickyNotes: backendWorkflow.stickyNotes || [],
```

### 10c. Storage / Database

If using JSON file storage or a database, no schema migration is needed since the field is optional. Existing saved workflows will simply have `stickyNotes: undefined`, and the code handles that with `|| []` fallbacks everywhere.

---

## File Checklist

| # | File | Action | Description |
|---|---|---|---|
| 1 | `types/index.ts` | **MODIFY** | Add `StickyNoteColor`, `StickyNote` interface, add `stickyNotes?` to `Workflow` |
| 2 | `components/StickyNote.tsx` | **CREATE** | Full component (244 lines) — edit, drag, resize, color, delete |
| 3 | `components/StickyNote.css` | **CREATE** | Full stylesheet (228 lines) |
| 4 | `components/MiniMap.tsx` | **CREATE** | Full component (~200 lines) — overview, click-to-nav, viewport indicator |
| 5 | `components/MiniMap.css` | **CREATE** | Full stylesheet (~120 lines) |
| 6 | `components/Canvas.tsx` | **MODIFY** | Import components, add state/handlers/JSX (see Step 6) |
| 7 | `components/Canvas.css` | **MODIFY** | Add `.sticky-notes-layer`, `.add-sticky-note-btn` styles |
| 8 | `pages/Editor.tsx` | **MODIFY** | Add `stickyNotes: []` to initial workflow state |
| 9 | `backend/src/types/workflow.ts` | **MODIFY** (optional) | Add `stickyNotes` to backend type |
| 10 | `services/workflowConverter.ts` | **MODIFY** (optional) | Pass through `stickyNotes` |

---

## Testing Checklist

### Sticky Notes
- [ ] Click "Add Sticky Note" button → note appears at canvas center
- [ ] Press `Shift+S` → note appears at canvas center
- [ ] Single click note → blue selection border appears
- [ ] Double click note → textarea appears, cursor focused
- [ ] Type text, click away → content saved
- [ ] Type text, press `Escape` → content reverted
- [ ] Type text, press `Ctrl+Enter` → content saved
- [ ] Drag note → position updates smoothly (respects zoom)
- [ ] Drag resize handle → size updates smoothly (min 150×100)
- [ ] Click color button → picker shows 6 colors
- [ ] Click a color → note background changes
- [ ] Click delete button → note removed
- [ ] Select note, press `Delete` → note removed
- [ ] Click empty canvas → note deselected
- [ ] Notes render behind workflow nodes (z-index layer order)
- [ ] Notes count shows in canvas info overlay
- [ ] Notes persist through workflow state updates

### MiniMap
- [ ] MiniMap appears at top-right when nodes exist
- [ ] MiniMap hidden when no nodes
- [ ] Node dots render at correct relative positions
- [ ] Sticky note spots render with correct colors
- [ ] Edge lines render between connected nodes
- [ ] Blue viewport rectangle matches visible canvas area
- [ ] Click on minimap → canvas pans to that location
- [ ] Zoom in/out → viewport rectangle updates
- [ ] Pan canvas → viewport rectangle updates
- [ ] MiniMap scales properly with many nodes spread apart
- [ ] MiniMap hidden on screens < 768px wide
- [ ] MiniMap hover → slight scale up visual feedback

### Integration
- [ ] Sticky notes and minimap work together
- [ ] Adding/removing notes updates minimap in real time
- [ ] Moving notes updates minimap dots in real time
- [ ] Space+drag panning still works (no interference)
- [ ] Middle-mouse panning still works
- [ ] Scroll zoom still works
- [ ] Node drag still works
- [ ] Connection drawing still works
- [ ] Save workflow includes `stickyNotes` data
- [ ] Load workflow restores `stickyNotes` data

---

## Implementation Order (Recommended)

1. **Types first** — Add types to `types/index.ts`
2. **StickyNote component + CSS** — Create standalone component
3. **MiniMap component + CSS** — Create standalone component
4. **Canvas integration** — Wire everything together
5. **Canvas CSS** — Add layer and button styles
6. **Editor init** — Add `stickyNotes: []`
7. **Backend** (if needed) — Update types and converters
8. **Test** — Run through the testing checklist

---

*End of integration plan.*
