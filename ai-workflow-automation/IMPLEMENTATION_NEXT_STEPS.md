# Workflow Editor - Implementation Guide & Next Steps

## 🎯 Current Implementation Status

### ✅ Complete
- Canvas component with full node rendering
- Node dragging and positioning
- Node deletion with edge cleanup
- Zoom and pan controls
- Grid background
- WorkflowNode component with 6 node types
- NodePalette sidebar with drag-drop
- Editor page with header and properties panel
- Type system with comprehensive TypeScript interfaces
- Professional CSS styling and animations
- Responsive design for mobile/tablet
- State management for workflow

### 🔄 Ready for Integration
- Backend API endpoints for CRUD operations
- Connection/edge drawing UI
- Node configuration panel
- Workflow execution endpoint
- Database persistence

---

## 📋 Next Steps Guide

### Step 1: Connect Backend API (CRITICAL)

**File to Edit:** `Editor.tsx` - `handleSaveWorkflow` function

**Current Code (Placeholder):**
```typescript
const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
        console.log('Saving workflow:', workflow);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLastSaved(new Date().toLocaleTimeString());
    } finally {
        setIsSaving(false);
    }
};
```

**Replace With:**
```typescript
const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
        const response = await fetch('/api/workflows', {
            method: workflow.id.startsWith('workflow_') && workflow.id.includes('Date.now') 
                ? 'POST' 
                : 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(workflow),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const saved = await response.json();
        setWorkflow(saved);
        setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
        console.error('Failed to save workflow:', error);
        alert('Failed to save workflow. Please try again.');
    } finally {
        setIsSaving(false);
    }
};
```

**Backend Endpoints Needed:**
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `GET /api/workflows/:id` - Load workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `GET /api/workflows` - List workflows

### Step 2: Implement Connection Drawing

**File to Edit:** `Canvas.tsx`

**Add Connection Drawing Logic:**

```typescript
// State for connection drawing
const [isConnecting, setIsConnecting] = useState(false);
const [connectionStart, setConnectionStart] = useState<string | null>(null);

// Handle clicking on node handle
const handleHandleClick = (nodeId: string, handleType: 'input' | 'output') => {
    if (!isConnecting) {
        setIsConnecting(true);
        setConnectionStart(nodeId);
    } else if (connectionStart !== nodeId) {
        // Create new edge
        const newEdge: Edge = {
            id: `edge_${Date.now()}`,
            source: connectionStart!,
            target: nodeId,
        };

        const updated = {
            ...workflow,
            edges: [...workflow.edges, newEdge],
        };

        onWorkflowChange?.(updated);
        setIsConnecting(false);
        setConnectionStart(null);
    }
};
```

**Update WorkflowNode to Accept Handle Clicks:**
```typescript
// Add to WorkflowNode.tsx component
<div 
    className="node-connector output"
    onMouseDown={() => onHandleClick?.(node.id, 'output')}
/>
```

### Step 3: Add Node Configuration Panel

**File to Create:** `NodeConfigPanel.tsx`

```typescript
import React from 'react';
import { NodeProps } from '../types';

interface NodeConfigPanelProps {
    node: NodeProps | null;
    onConfigChange: (config: any) => void;
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onConfigChange }) => {
    if (!node) {
        return <div>Select a node to configure</div>;
    }

    return (
        <div className="config-panel">
            <h4>{node.type} Configuration</h4>
            
            {/* Render config based on node type */}
            {node.type === 'webhook' && (
                <>
                    <label>URL Path</label>
                    <input 
                        type="text" 
                        value={node.data.config.path || ''}
                        onChange={(e) => onConfigChange({ ...node.data.config, path: e.target.value })}
                    />
                </>
            )}
            
            {node.type === 'javascript' && (
                <>
                    <label>Code</label>
                    <textarea 
                        value={node.data.config.code || ''}
                        onChange={(e) => onConfigChange({ ...node.data.config, code: e.target.value })}
                    />
                </>
            )}
            
            {/* Add more node type configs */}
        </div>
    );
};

export default NodeConfigPanel;
```

**Use in Editor.tsx:**
```typescript
<NodeConfigPanel 
    node={workflow.nodes.find(n => n.id === selectedNodeId) || null}
    onConfigChange={(config) => {
        // Update node config
    }}
/>
```

### Step 4: Add Workflow Execution

**File to Create:** `ExecutionPanel.tsx`

```typescript
interface ExecutionPanelProps {
    workflow: Workflow;
    onExecute: (workflowId: string) => Promise<void>;
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({ workflow, onExecute }) => {
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<any>(null);

    const handleExecute = async () => {
        setIsExecuting(true);
        try {
            const response = await fetch(`/api/workflows/${workflow.id}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            setExecutionResult(result);
        } catch (error) {
            console.error('Execution failed:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div>
            <button onClick={handleExecute} disabled={isExecuting}>
                {isExecuting ? '⏳ Running...' : '▶️ Execute'}
            </button>
            {executionResult && (
                <pre>{JSON.stringify(executionResult, null, 2)}</pre>
            )}
        </div>
    );
};
```

### Step 5: Add Undo/Redo Support

**Create Custom Hook:** `useWorkflowHistory.ts`

```typescript
import { useState } from 'react';
import { Workflow } from '../types';

interface WorkflowHistory {
    workflow: Workflow;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    pushHistory: (workflow: Workflow) => void;
}

export function useWorkflowHistory(initialWorkflow: Workflow): WorkflowHistory {
    const [history, setHistory] = useState<Workflow[]>([initialWorkflow]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const undo = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const redo = () => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const pushHistory = (workflow: Workflow) => {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(workflow);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };

    return {
        workflow: history[currentIndex],
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        undo,
        redo,
        pushHistory,
    };
}
```

**Use in Editor:**
```typescript
const { workflow, canUndo, canRedo, undo, redo, pushHistory } = useWorkflowHistory(initialWorkflow);

// Instead of setWorkflow, use:
pushHistory(updatedWorkflow);

// Add keyboard shortcuts
useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'z') undo();
        if (e.ctrlKey && e.key === 'y') redo();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## 🗄️ Backend Setup Required

### Database Schema (MongoDB/Mongoose)

**Workflow Model:**
```typescript
const workflowSchema = {
    _id: ObjectId,
    userId: String,  // Reference to user
    name: String,
    description: String,
    nodes: [
        {
            id: String,
            type: String,
            data: {
                label: String,
                config: Object
            },
            position: {
                x: Number,
                y: Number
            }
        }
    ],
    edges: [
        {
            id: String,
            source: String,
            target: String
        }
    ],
    status: String,  // draft, published, archived
    createdAt: Date,
    updatedAt: Date
};
```

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/workflows` | Create workflow |
| GET | `/api/workflows` | List user workflows |
| GET | `/api/workflows/:id` | Get workflow |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:id/execute` | Execute workflow |
| GET | `/api/workflows/:id/executions` | Get execution history |

---

## 🔐 Authentication Integration

**Update API Calls with Auth:**

```typescript
// Get token from localStorage or context
const token = localStorage.getItem('authToken');

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

// Use in all API calls
await fetch('/api/workflows', {
    method: 'POST',
    headers,
    body: JSON.stringify(workflow)
});
```

---

## 🧪 Testing Guide

### Unit Tests for Canvas

```typescript
describe('Canvas Component', () => {
    it('should add node on drop', () => {
        // Test node addition
    });

    it('should delete node with edges', () => {
        // Test node deletion
    });

    it('should handle zoom', () => {
        // Test zoom functionality
    });
});
```

### Integration Tests

```typescript
describe('Editor Integration', () => {
    it('should save workflow to backend', async () => {
        // Test full save flow
    });

    it('should load workflow from backend', async () => {
        // Test full load flow
    });
});
```

---

## 🚀 Deployment Checklist

- [ ] Backend API endpoints implemented
- [ ] Database schema created
- [ ] Authentication integrated
- [ ] Connection drawing implemented
- [ ] Node configuration panel added
- [ ] Workflow execution endpoint working
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Performance optimized
- [ ] Mobile responsiveness tested
- [ ] Accessibility verified
- [ ] Security review completed

---

## 📚 Additional Resources

- **React Patterns:** https://reactjs.org/docs/hooks-intro.html
- **TypeScript Guide:** https://www.typescriptlang.org/docs/
- **SVG Drawing:** https://developer.mozilla.org/en-US/docs/Web/SVG
- **Canvas API:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Follow these steps to complete the workflow automation system!**
