# 📍 Code Location Map - Where Everything Is

## Project Root
```
/Users/ayshaharis/Documents/main-pro/workflow-pro/
```

---

## 🎯 Main Backend Files (Where the Magic Happens)

### 1. Node Executor - THE CORE ENGINE
**Path:** `ai-workflow-automation/backend/src/services/nodeExecutor.ts`
**Lines:** 523 total
**What it does:** Executes all node types (Sheets, AI, Telegram, etc.)

**Key Functions:**
```typescript
Line 27:   executeNode()               // Main dispatcher
Line 72:   executeGoogleSheets()       // Google Sheets API
Line 157:  executeOpenAI()             // OpenAI + Gemini API
Line 309:  executeTelegram()           // Telegram Bot API
Line 379:  executeWhatsApp()           // WhatsApp Business API
Line 288:  executeSet()                // Data transformation
Line 459:  replaceVariables()          // {{variable}} replacement
Line 489:  extractSpreadsheetId()      // Parse Sheet URL
Line 505:  extractRowDataInOrder()     // Format data for sheets
```

**Important Sections:**
```
Lines 196-231: Gemini API Integration (FREE AI!)
Lines 233-265: OpenAI API Integration (Paid)
Lines 462-483: Variable replacement logic
Lines 136-144: Google Sheets success response
```

---

### 2. Workflow Orchestrator
**Path:** `ai-workflow-automation/backend/src/services/executionService.ts`
**Lines:** 137 total
**What it does:** Runs nodes in correct order

**Key Functions:**
```typescript
Line 18:   executeWorkflow()           // Main orchestrator
Line 56:   Build node map              // id → node lookup
Line 60:   Build edge map              // source → targets
Line 80:   while loop                  // Execute nodes in order
Line 96:   await executeNode()         // Call node executor
Line 102:  Add next nodes to queue     // Follow edges
```

**Flow:**
```
1. Find webhook node (starting point)
2. Execute webhook → get next nodes from edges
3. Execute each node → pass data forward
4. Continue until all nodes executed
5. Return final result
```

---

### 3. Workflow Storage
**Path:** `ai-workflow-automation/backend/src/store/workflowStore.ts`
**Lines:** 82 total
**What it does:** Saves workflows in memory

**Key Functions:**
```typescript
Line 5:    saveWorkflow()              // Save workflow to Map
Line 10:   getWorkflow()               // Get by ID
Line 14:   findWorkflowByWebhook()     // Find by path + method
Line 61:   extractRouteParams()        // Parse URL params
Line 79:   getAllWorkflows()           // List all
```

---

### 4. Webhook Routes
**Path:** `ai-workflow-automation/backend/src/routes/webhookRoutes.ts`
**Lines:** ~100 total
**What it does:** HTTP endpoints for webhooks

**Key Routes:**
```typescript
POST /workflows                  // Save workflow
GET  /workflows                  // List workflows
POST /webhook/:path             // Trigger workflow
GET  /health                    // Health check
```

---

### 5. Main Server
**Path:** `ai-workflow-automation/backend/src/server.ts`
**What it does:** Start Express server on port 4000

---

## 🎨 Main Frontend Files

### 1. Visual Canvas Editor
**Path:** `ai-workflow-automation/frontend/src/components/Canvas.tsx`
**Lines:** ~400 total
**What it does:** Drag-and-drop workflow editor

**Key Features:**
```typescript
React Flow canvas
Node drag-and-drop
Edge connections
Zoom/pan controls
Node deletion
```

---

### 2. Node Configuration Panel
**Path:** `ai-workflow-automation/frontend/src/components/NodeConfigPanel.tsx`
**Lines:** 1800+ total
**What it does:** Configure each node's settings

**Key Sections:**
```typescript
Line 900-1100:   Settings tab rendering
Line 1049-1062:  Gemini models dropdown
Line 1718-1756:  Credentials tab
Line 200-400:    State management
```

**Node-Specific Config:**
```
Lines 650-750:   Webhook config
Lines 850-950:   Google Sheets config
Lines 1000-1100: OpenAI/Gemini config
Lines 1150-1250: Telegram config
Lines 1300-1400: WhatsApp config
Lines 1450-1550: Set node config
```

---

### 3. Main Editor Page
**Path:** `ai-workflow-automation/frontend/src/pages/Editor.tsx`
**What it does:** Main page with canvas + sidebar

---

### 4. Sidebar (Node Palette)
**Path:** `ai-workflow-automation/frontend/src/components/Sidebar.tsx`
**What it does:** List of draggable nodes

---

## 📦 Configuration Files

### 1. Root Package.json
**Path:** `ai-workflow-automation/package.json`
**Commands:**
```json
npm start    → Start backend + frontend
npm build    → Build both
```

---

### 2. Backend Package.json
**Path:** `ai-workflow-automation/backend/package.json`
**Dependencies:**
```json
express          // Web server
node-fetch       // HTTP client
typescript       // Type safety
```

---

### 3. Frontend Package.json
**Path:** `ai-workflow-automation/frontend/package.json`
**Dependencies:**
```json
react            // UI framework
react-flow       // Canvas library
tailwindcss      // Styling
```

---

## 🧪 Test Files

### 1. Test Form
**Path:** `test-form.html`
**What it does:** HTML form to test workflows

---

### 2. Test Scripts
**Path:** `ai-workflow-automation/setup-and-test.js`
**What it does:** Node.js script to register + test workflow

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [DEMO_GUIDE.md](DEMO_GUIDE.md) | Full demo guide for professor |
| [QUICK_DEMO_CARD.md](QUICK_DEMO_CARD.md) | Quick reference card (print this!) |
| [CODE_LOCATION_MAP.md](CODE_LOCATION_MAP.md) | This file |
| [OPENAI_CONFIG_GUIDE.md](ai-workflow-automation/OPENAI_CONFIG_GUIDE.md) | OpenAI/Gemini setup |
| [TESTING_GUIDE.md](ai-workflow-automation/TESTING_GUIDE.md) | Testing instructions |
| [/tmp/refresh-google-token.md](/tmp/refresh-google-token.md) | Token refresh guide |

---

## 🗺️ Visual Code Map

```
ai-workflow-automation/
│
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── nodeExecutor.ts       ⭐ MAIN LOGIC (523 lines)
│   │   │   │   ├── executeNode()              [Line 27]
│   │   │   │   ├── executeGoogleSheets()      [Line 72]
│   │   │   │   ├── executeOpenAI()            [Line 157]
│   │   │   │   │   ├── Gemini support        [Line 196]
│   │   │   │   │   └── OpenAI support        [Line 233]
│   │   │   │   ├── executeTelegram()         [Line 309]
│   │   │   │   ├── executeWhatsApp()         [Line 379]
│   │   │   │   ├── executeSet()              [Line 288]
│   │   │   │   └── replaceVariables()        [Line 459]
│   │   │   │
│   │   │   └── executionService.ts   ⭐ ORCHESTRATION (137 lines)
│   │   │       └── executeWorkflow()         [Line 18]
│   │   │
│   │   ├── store/
│   │   │   └── workflowStore.ts      📦 STORAGE (82 lines)
│   │   │       ├── saveWorkflow()            [Line 5]
│   │   │       └── findWorkflowByWebhook()   [Line 14]
│   │   │
│   │   ├── routes/
│   │   │   └── webhookRoutes.ts      🌐 HTTP ROUTES
│   │   │       ├── POST /workflows
│   │   │       ├── GET  /workflows
│   │   │       └── POST /webhook/:path
│   │   │
│   │   └── server.ts                 🚀 MAIN SERVER
│   │
│   └── dist/                         📤 Compiled JS
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Canvas.tsx            🎨 VISUAL EDITOR (400 lines)
│       │   ├── NodeConfigPanel.tsx   ⚙️  NODE CONFIG (1800 lines)
│       │   │   ├── Settings tab              [Line 900]
│       │   │   ├── Gemini models             [Line 1049]
│       │   │   └── Credentials tab           [Line 1718]
│       │   └── Sidebar.tsx           📋 NODE PALETTE
│       │
│       └── pages/
│           └── Editor.tsx            📄 MAIN PAGE
│
└── test-form.html                    🧪 TEST FORM
```

---

## 🔍 Where to Look for Specific Features

### Google Sheets Integration
```
backend/src/services/nodeExecutor.ts
  ↳ Lines 72-152: executeGoogleSheets()
  ↳ Line 111: API call to Google Sheets
  ↳ Line 505: extractRowDataInOrder() - Format data
```

### Gemini (FREE AI) Integration
```
backend/src/services/nodeExecutor.ts
  ↳ Lines 157-283: executeOpenAI()
  ↳ Line 172: Detect Gemini model
  ↳ Lines 196-231: Gemini API call
  ↳ Line 203: Gemini API URL
```

### Variable Replacement ({{body.name}})
```
backend/src/services/nodeExecutor.ts
  ↳ Lines 459-484: replaceVariables()
  ↳ Line 462: Regex to find {{variables}}
  ↳ Line 463: Split path by dots
  ↳ Line 466: Navigate object tree
```

### Telegram Integration
```
backend/src/services/nodeExecutor.ts
  ↳ Lines 309-374: executeTelegram()
  ↳ Line 337: Telegram API URL
  ↳ Line 358: Success logging
```

### Workflow Execution Order
```
backend/src/services/executionService.ts
  ↳ Lines 56-67: Build edge map
  ↳ Lines 80-106: Execute loop
  ↳ Line 96: Call executeNode()
  ↳ Line 101: Get next nodes from edges
```

### Visual Editor
```
frontend/src/components/Canvas.tsx
  ↳ React Flow implementation
  ↳ Node rendering
  ↳ Edge connections
  ↳ Drag-and-drop
```

### Node Configuration UI
```
frontend/src/components/NodeConfigPanel.tsx
  ↳ Lines 1049-1062: Gemini models dropdown
  ↳ Lines 1718-1756: Credentials tab
  ↳ Dynamic form rendering per node type
```

---

## 🎯 Most Important Files to Show Professor

### Priority 1 (Must Show)
1. **backend/src/services/nodeExecutor.ts** - Core logic (Lines 157, 72, 309, 459)
2. **backend/src/services/executionService.ts** - Orchestration (Line 18, 80)
3. **frontend/src/components/Canvas.tsx** - Visual editor

### Priority 2 (Should Show)
4. **frontend/src/components/NodeConfigPanel.tsx** - UI config (Line 1049)
5. **backend/src/store/workflowStore.ts** - Data storage
6. **test-form.html** - Demo form

---

## 🚀 How to Navigate During Demo

### VS Code Setup
```bash
# Open project in VS Code
cd ~/Documents/main-pro/workflow-pro/ai-workflow-automation
code .
```

**Quick File Navigation (Cmd+P):**
```
nodeExecutor.ts       → Backend core
executionService.ts   → Orchestration
Canvas.tsx           → Visual editor
NodeConfigPanel.tsx  → Config UI
```

**Go to Line (Cmd+G):**
```
nodeExecutor.ts:157  → Gemini integration
nodeExecutor.ts:72   → Google Sheets
nodeExecutor.ts:459  → Variable replacement
```

---

## 📝 Quick Copy-Paste Paths

```bash
# Main backend logic
/Users/ayshaharis/Documents/main-pro/workflow-pro/ai-workflow-automation/backend/src/services/nodeExecutor.ts

# Orchestration
/Users/ayshaharis/Documents/main-pro/workflow-pro/ai-workflow-automation/backend/src/services/executionService.ts

# Visual editor
/Users/ayshaharis/Documents/main-pro/workflow-pro/ai-workflow-automation/frontend/src/components/Canvas.tsx

# Node config UI
/Users/ayshaharis/Documents/main-pro/workflow-pro/ai-workflow-automation/frontend/src/components/NodeConfigPanel.tsx

# Test form
/Users/ayshaharis/Documents/main-pro/workflow-pro/test-form.html
```

---

## 🎓 Explaining the Architecture to Professor

**Start with:**
"The system has a **backend** (Express.js on port 4000) and **frontend** (React on port 3000)."

**Backend:**
- `nodeExecutor.ts` executes individual nodes (Google Sheets, AI, Telegram)
- `executionService.ts` orchestrates the workflow (runs nodes in order)
- `workflowStore.ts` saves workflows in memory (Map data structure)

**Frontend:**
- `Canvas.tsx` provides visual workflow editor (React Flow library)
- `NodeConfigPanel.tsx` lets users configure each node
- `Sidebar.tsx` shows available node types

**Flow:**
1. User creates workflow in visual editor (frontend)
2. Clicks "Apply Changes" → saves to backend (`POST /workflows`)
3. Form submission → triggers webhook (`POST /webhook/form-submit`)
4. Backend finds workflow → executes nodes in order → returns result
5. Data flows: Webhook → Sheets → AI → Set → Telegram

---

Good luck with your demo! 🎓
