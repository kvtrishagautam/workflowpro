# WorkflowPro — Implementation Report

---

## 1. Frontend Technology Stack

### 1.1 React 17.0.2
The user interface is built with **React 17**, a declarative, component-based JavaScript library for building interactive UIs. React's virtual DOM diffing ensures efficient re-renders when workflow state changes (nodes added/removed, edges drawn, execution results returned).

### 1.2 TypeScript 4.x
All frontend source files (`*.tsx`, `*.ts`) are written in **TypeScript**. Strict typing via `tsconfig.json` (`"strict": true`) catches interface mismatches at compile time — particularly important for the complex node-configuration objects, workflow run logs, and API response shapes shared between UI components and the backend.

### 1.3 React Router DOM 5.3.4
Client-side routing is handled by **React Router DOM v5**. Routes defined in `App.tsx` separate the landing page from the workflow editor (`/editor/:id`) and the dashboard. The router preserves deep-link URLs so users can share direct links to specific workflows.

### 1.4 Recharts 2.15.4
Analytics and reporting screens use **Recharts**, a composable charting library built on D3 and React. Bar charts, line charts, and pie charts render workflow execution histories, node success rates, and email delivery statistics directly from MongoDB-persisted run data.

### 1.5 Lucide React 0.575.0
All UI icons are sourced from **Lucide React** — a consistent, tree-shakeable SVG icon library. Icons appear on node palette tiles, toolbar buttons, and status indicators throughout the editor canvas.

### 1.6 Create React App 4.0.3 (react-scripts)
The project was scaffolded with **Create React App**. CRA manages webpack bundling, Babel transpilation, Jest test runner, and the development server (`npm start` → port 3000/3001). The `DISABLE_ESLINT_PLUGIN=true` and `SKIP_PREFLIGHT_CHECK=true` environment flags in `.env` bypass dependency version conflicts without ejecting the CRA config.

### 1.7 Component Architecture

| Component | File | Role |
|---|---|---|
| `Editor` | `pages/Editor.tsx` | Canvas host, drag-and-drop, run orchestration |
| `NodeConfigPanel` | `components/NodeConfigPanel.tsx` | Right-panel node configuration |
| `WebhookConfigPanel` | `components/WebhookConfigPanel.tsx` | Webhook-specific configuration |
| `SuccessToast` | `components/SuccessToast.tsx` | Animated apply-changes notification |
| `RunHistory` | `components/RunHistory.tsx` | Workflow run logs panel |
| `NodePalette` | `components/NodePalette.tsx` | Draggable node tile list |
| `WorkflowCanvas` | `components/WorkflowCanvas.tsx` | SVG edge rendering + node placement |

### 1.8 State Management
Global state is managed through a set of lightweight Zustand-style **store modules** under `frontend/src/store/`:

- `workflowStore.ts` — nodes, edges, active workflow metadata
- `runStore.ts` — `WorkflowRun[]` list, `createRun()` / `updateRun()` helpers
- `uiStore.ts` — panel visibility, selected node ID, loading flags

---

## 2. Backend Technology Stack

### 2.1 Node.js (LTS)
The server runtime is **Node.js LTS**. Its non-blocking I/O model is well-suited to the workflow engine's concurrent pattern: multiple workflow branches can be awaited in parallel (`Promise.all`) without blocking the event loop.

### 2.2 Express 4.22.1
HTTP routing and middleware is provided by **Express 4**. The API surface is organised under `/api/workflows`, `/api/nodes`, `/api/runs`, and `/api/email`. Express middleware handles JSON body parsing, CORS, and centralised error formatting before responses reach the client.

### 2.3 TypeScript (ES2020 / CommonJS)
Backend TypeScript is compiled to **ES2020** targeting **CommonJS** modules (`tsconfig.json`: `"module": "commonjs"`). Shared interfaces (node configs, workflow payloads, run logs) are defined once in `packages/shared/src/` and imported by both the backend services and the frontend via the pnpm workspace `@workflowpro/shared` alias.

### 2.4 ts-node 10.9.2
Development and test scripts run via **ts-node** — a TypeScript execution engine that transpiles `.ts` files on the fly without a separate build step. All scripts in `backend/scripts/` are invoked with `npx ts-node scripts/<name>.ts`.

### 2.5 Nodemailer 6.10.1
Outbound email is sent through **Nodemailer**. SMTP credentials (Gmail OAuth2 or App Password) are stored in `backend/.env`. The `EmailSendNode` calls `transporter.sendMail()` with the personalised HTML body assembled upstream by the merge node.

### 2.6 node-cron 4.2.1
Recurring workflow schedules use **node-cron**, a cron-syntax task scheduler. `scheduled_jobs.json` stores active job definitions (`workflowId`, `cronExpression`, `enabled`). On server start, `src/services/schedulerService.ts` loads the file and registers each active job with `cron.schedule()`.

### 2.7 googleapis 171.4.0
Google Sheets integration is powered by the official **Google APIs Node.js client**. The `GoogleSheetsNode` authenticates via a service-account JSON key (credentials path stored in `.env`) and calls `sheets.spreadsheets.values.get()` to pull tabular data into the workflow pipeline.

### 2.8 csv-parse 6.1.0
CSV files uploaded to the workflow or referenced by path are parsed with **csv-parse** in streaming or synchronous mode. The parsed rows are emitted as a JavaScript array of objects (header row → keys) that downstream analysis nodes consume.

### 2.9 Axios 1.4.0 / node-fetch 2.7.0
HTTP requests to external services (REST APIs, webhooks, web-scraping targets) are made via **Axios** (within Express route handlers and service classes) and **node-fetch** (in isolated node `execute()` calls). Both are present because different historical nodes were written against different HTTP client conventions.

### 2.10 Joi 17.9.2
Request bodies hitting the Express API are validated with **Joi** schemas before reaching service logic. Invalid workflow payloads (missing `nodes` array, malformed edge definitions, unknown node types) are rejected at the route layer with structured `400` error responses.

### 2.11 jsonwebtoken 9.0.0 / bcryptjs 2.4.3
User authentication uses **JWT** (JSON Web Tokens) for stateless session tokens and **bcryptjs** for password hashing. The `AuthService` issues a signed JWT on login; protected routes verify the token via Express middleware before allowing access to workflow CRUD endpoints.

### 2.12 Mongoose 7.0.0 / MongoDB
Persistent data lives in a **MongoDB** instance (`localhost:27017`, database `workflow-automation`) accessed via **Mongoose 7** ODM. The five collections are:

| Collection | Mongoose Model | Purpose |
|---|---|---|
| `workflows` | `Workflow` | Node/edge graph definitions |
| `runs` | `WorkflowRun` | Execution history + per-node logs |
| `emails` | `Email` | Discovered and sent email records |
| `recipients` | `Recipient` | Contact list for bulk campaigns |
| `users` | `User` | Authentication accounts |

Mongoose schemas enforce field types and required constraints; the `mongoClient.ts` module opens a single connection pool reused across all requests.

### 2.13 uuid 9.0.0
Every node instance, workflow, run record, and email recipient is assigned a **UUID v4** identifier via the `uuid` package. UUIDs are generated at creation time in service layer code rather than relying on MongoDB's `_id` ObjectIds, keeping IDs consistent between the frontend (which stores nodes in React state) and the database.

---

## 3. Implementation

### 3.1 Overview
WorkflowPro is a full-stack, no-code workflow automation platform. Users build automation pipelines visually by dragging node tiles onto a canvas and connecting them with directed edges. The platform supports email discovery and delivery, CSV data analysis, Google Sheets ingestion, HTTP webhooks, and scheduled execution — all configurable through a properties panel without writing code.

### 3.2 Visual Workflow Editor
The editor canvas (`Editor.tsx` + `WorkflowCanvas.tsx`) renders nodes as positioned `<div>` elements and edges as SVG `<path>` curves. Nodes are dragged from the `NodePalette` and dropped onto the canvas; the drop handler assigns a UUID and initial `x/y` coordinates. Connecting two nodes draws a Bézier edge stored as `{ source, target }` in `workflowStore`. The toolbar provides Run, Save, and Delete actions. A right-side panel (`NodeConfigPanel`) exposes the selected node's configuration fields — which are dynamically resolved from `nodeRegistry.ts` — and shows a green animated toast (`SuccessToast`) when the user applies changes.

### 3.3 Workflow Execution Engine
Execution is triggered from `Editor.tsx` via `POST /api/workflows/execute`. The backend service resolves the node execution order using **topological sort** on the edge graph, ensuring every dependency node completes before its consumers start. Each node type is implemented as a class with an `execute(input, config)` method registered in `nodeRegistry`:

- `TriggerNode` — initiates the pipeline with seed data or a webhook payload
- `CSVParseNode` — parses delimited file input into row arrays
- `DataAnalysisNode` — computes summary statistics (min, max, mean, category counts)
- `EmailDiscoveryNode` — scrapes or fetches email addresses from a target URL
- `EmailMergeNode` — joins discovered addresses with a recipient template
- `EmailSendNode` — delivers personalised HTML emails via Nodemailer SMTP
- `GoogleSheetsNode` — reads a spreadsheet range and emits row data
- `WebhookNode` — fires an HTTP POST to an external endpoint with pipeline results

A known bug discovered during development was an incorrect **merge node order**: the pipeline placed the merge step before discovery, so addresses were empty at send time. Fixing the edge insertion order resolved the issue.

### 3.4 Email Automation Pipeline
The email workflow chains five nodes: `Trigger → EmailDiscovery → EmailMerge → DataAnalysis → EmailSend`. The discovery node fetches target URLs and extracts `mailto:` links and regex-matched address strings, deduplicating results before upserting them into the `emails` MongoDB collection. The merge node attaches each address to a template object carrying the subject, body, and personalisation tokens. The send node iterates merged records and dispatches individual SMTP messages, recording delivery status back to MongoDB.

### 3.5 Data Analysis Pipeline
CSV data flows through `Trigger → CSVParse → DataAnalysis → (optional) GoogleSheets → EmailSend`. The `DataAnalysisNode` groups rows by a configurable `categoryField`, aggregates numeric columns, and returns a `summaryStats` object with per-category totals, averages, and counts. Four sample datasets are provided in `backend/test-data/`: `sales-data.csv` (30 rows), `tasks-data.csv` (25 rows), `attendance-data.csv` (40 rows), and `expenses-data.csv` (30 rows).

### 3.6 Scheduled Workflow Service
`schedulerService.ts` reads `scheduled_jobs.json` at startup and calls `cron.schedule(expression, callback)` for each active job. The callback re-invokes the workflow execution service with the stored workflow ID. New schedules are persisted by appending to the JSON file via the `/api/schedule` endpoint. This enables time-triggered pipelines (e.g., daily expense digest emails, weekly sales summaries) without maintaining a separate task queue.

---

## 4. Testing

### 4.1 End-to-End API Test — `test-analysis-workflow.ts`

This script drives the full backend API pipeline for all four CSV categories by posting structured workflow payloads to `POST /api/workflows/execute`.

**Script excerpt:**

```typescript
interface WorkflowTest {
  name: string;
  category: string;
  csvData: string;
}

const tests: WorkflowTest[] = [
  { name: 'Sales Analysis',      category: 'sales',      csvData: salesCSV },
  { name: 'Task Management',     category: 'tasks',      csvData: tasksCSV },
  { name: 'Attendance Tracking', category: 'attendance', csvData: attendanceCSV },
  { name: 'Expense Management',  category: 'expenses',   csvData: expensesCSV },
];

async function runTest(test: WorkflowTest): Promise<boolean> {
  const payload = buildWorkflowPayload(test.category, test.csvData);
  const response = await axios.post(
    'http://localhost:5000/api/workflows/execute',
    payload
  );
  const results = response.data.results as Record<string, NodeResult>;
  const analysisNode = Object.values(results)
    .find(r => r.nodeType === 'data-analysis');
  return analysisNode?.status === 'success';
}
```

**Terminal output (all 4 passed):**

```
Running WorkflowPro Analysis Tests
====================================
✓ Sales Analysis          PASSED
✓ Task Management         PASSED
✓ Attendance Tracking     PASSED
✓ Expense Management      PASSED
====================================
Results: 4/4 tests passed
```

### 4.2 Direct Node Unit Test — `test-data-workflow.ts`

This script calls each node's `execute()` method directly (no HTTP layer) using a hardcoded 10-row CSV sample covering product sales across three regions.

**Script excerpt:**

```typescript
const sampleCSV = `date,product,region,sales,units
2024-01-15,Laptop,North,1200,3
2024-01-16,Phone,South,800,5
...`;

// Step 1: Parse CSV
const parseNode = new CSVParseNode();
const parseResult = await parseNode.execute({ csvData: sampleCSV }, {});

// Step 2: Analyse data
const analysisNode = new DataAnalysisNode();
const analysisResult = await analysisNode.execute(
  parseResult.output,
  { categoryField: 'product', valueField: 'sales' }
);

console.log('Analysis result:', JSON.stringify(analysisResult, null, 2));
```

**Expected output:**

```json
{
  "status": "success",
  "output": {
    "summaryStats": {
      "Laptop": { "count": 4, "total": 4800, "average": 1200 },
      "Phone":  { "count": 3, "total": 2400, "average":  800 },
      "Tablet": { "count": 3, "total": 2100, "average":  700 }
    },
    "totalRows": 10
  }
}
```

### 4.3 Simple Workflow Integration Test — `simple-workflow-test.ts`

A three-step sequential test (parse → analyse → format) against a five-row subset, used to verify the pipeline handoff between adjacent nodes before running the full four-category suite.

**Script excerpt:**

```typescript
const sampleCSV = `category,value,label
A,100,First
B,200,Second
A,150,Third
C,300,Fourth
B,250,Fifth`;

// Parse
const parsed = await new CSVParseNode().execute({ csvData: sampleCSV }, {});
// Analyse
const analysed = await new DataAnalysisNode().execute(
  parsed.output,
  { categoryField: 'category', valueField: 'value' }
);
console.log('Summary stats:', analysed.output.summaryStats);
```

**Expected output:**

```
Summary stats: {
  A: { count: 2, total: 250, average: 125 },
  B: { count: 2, total: 450, average: 225 },
  C: { count: 1, total: 300, average: 300 }
}
```

### 4.4 Test Data Summary

| Dataset | File | Rows | Key Fields |
|---|---|---|---|
| Sales | `sales-data.csv` | 30 | `date`, `product`, `region`, `sales`, `units` |
| Tasks | `tasks-data.csv` | 25 | `taskId`, `assignee`, `status`, `priority`, `dueDate` |
| Attendance | `attendance-data.csv` | 40 | `employeeId`, `date`, `status`, `hoursWorked` |
| Expenses | `expenses-data.csv` | 30 | `expenseId`, `department`, `category`, `amount`, `date` |

All four datasets are stored in `backend/test-data/` and are referenced by the end-to-end test script. Each CSV is generated to reflect realistic business data distributions (varied categories, date ranges spanning Q1–Q2 2024, numeric values within plausible business ranges).

---

*Document prepared for project report — WorkflowPro, March 2026.*
