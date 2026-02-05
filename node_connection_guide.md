# WorkflowPro Node Connection Guide

This guide helps you understand how to build workflows by connecting different types of nodes in the WorkflowPro editor.

## 🔗 Basic Concepts

-   **Nodes**: The building blocks of your workflow (Triggers, Actions, Logic).
-   **Connectors**: Points where you can create links.
    -   **Input**: Located at the **TOP** of a node. Receives data/control.
    -   **Output**: Located at the **BOTTOM** of a node. Sends data/control.
-   **Edges**: The lines connecting two nodes.

## 🖱️ How to Connect Nodes

1.  **Locate the Output**: Hover over the bottom center of the *source* node (the one that comes first). You should see a small connector point.
2.  **Drag**: Click and drag from that bottom connector. A line will appear following your mouse.
3.  **Connect to Input**: Drag the line to the top center of the *target* node (the next step).
4.  **Release**: Release the mouse button over the top connector.
    -   ✅ If successful, a solid line will connect them.
    -   ❌ If not, the line will disappear.

> **Note**: You cannot create a loop (connecting a node back to itself or its ancestors) if the logic prevents it, though the current editor is flexible.

## 🔀 Branching Logic (Conditional Nodes)

**Conditional Nodes** (like "IF Condition") are unique because they split the workflow into two paths:

1.  **True Path**: Executed when the condition is met.
2.  **False Path**: Executed when the condition is NOT met.

### How to set paths:
1.  Connect the Conditional Node to the next node as usual.
2.  **Click the Connection Line** (Edge) you just created.
3.  In the "Edge Controls" that appear:
    -   Click **True** to mark this path for success.
    -   Click **False** to mark this path for failure/alternative.

## 🛠️ Common Node Connection Patterns

### 1. Simple Linear Flow
**Trigger** → **Action** → **Action**
*Example: Webhook → Filter → Email*

### 2. Decision Flow
**Trigger** → **Conditional**
├── (True) → **Action A**
└── (False) → **Action B**

*Example: New Lead → Is VIP?*
*True → Send to Slack*
*False → Send standard Email*

### 3. Loop / Batch Processing
**Trigger** → **Split Batches** → **Action** → (Loop back for next batch)
*(Advanced: Requires careful setup of batch logic)*

## ⌨️ Shortcuts & Tips

-   **Delete Connection**: Click on a line to select it, then press `Delete` or `Backspace`.
-   **Pan Canvas**: Hold `Spacebar` + Drag to move around.
-   **Zoom**: Use Mouse Wheel or the +/- buttons.
-   **Auto-Layout**: The editor tries to fit the view when you load, but you can manually arrange nodes to make the flow clear.

## 🐞 Troubleshooting

-   **Can't connect?** Ensure you are dragging from **Output (Bottom)** to **Input (Top)**. You generally cannot connect Input to Input or Output to Output.
-   **Node not running?** Check if it is disconnected. Every node (except the Trigger) must have an incoming connection.
-   **Data missing?** Ensure the previous node actually passes data. For example, a "Filter" node might stop execution if the data doesn't match criteria.
