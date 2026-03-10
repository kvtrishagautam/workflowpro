# 🎓 Workflow Automation System - Demo Guide

## Quick Start (2 minutes)

### 1. Start the Application

```bash
cd ~/Documents/main-pro/workflow-pro/ai-workflow-automation
npm start
```

This starts **both** backend (port 4000) and frontend (port 3000) simultaneously.

**You'll see:**
```
[0] 🚀 Webhook Backend Server Started
[0] 📍 URL: http://localhost:4000
[1] Compiled successfully!
[1] You can now view the app in the browser.
[1] Local: http://localhost:3000
```

### 2. Open the Visual Editor

Open browser: **http://localhost:3000**

You'll see a canvas-based workflow editor with drag-and-drop nodes.

### 3. Test with Pre-Built Form

Open: **file:///Users/ayshaharis/Documents/main-pro/workflow-pro/test-form.html**

Fill in the form and submit - it will trigger your workflow!

---

## Project Architecture

### Directory Structure

```
ai-workflow-automation/
├── backend/                    # Express.js backend (Port 4000)
│   ├── src/
│   │   ├── server.ts          # Main server file
│   │   ├── routes/
│   │   │   └── webhookRoutes.ts    # Webhook endpoints
│   │   ├── services/
│   │   │   ├── nodeExecutor.ts     # ⭐ NODE EXECUTION LOGIC
│   │   │   └── executionService.ts # Workflow orchestration
│   │   ├── store/
│   │   │   └── workflowStore.ts    # In-memory workflow storage
│   │   └── types/
│   │       └── workflow.ts         # TypeScript types
│   └── dist/                   # Compiled JavaScript
│
├── frontend/                   # React frontend (Port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx          # ⭐ VISUAL WORKFLOW EDITOR
│   │   │   ├── NodeConfigPanel.tsx # ⭐ NODE CONFIGURATION UI
│   │   │   └── Sidebar.tsx         # Node palette
│   │   ├── engine/
│   │   │   └── executeNode.ts      # Client-side execution (legacy)
│   │   ├── pages/
│   │   │   └── Editor.tsx          # Main editor page
│   │   └── types/
│   │       └── index.ts            # TypeScript types
│   └── public/
│
├── test-form.html              # Demo form for testing
├── package.json                # Root npm scripts
└── DEMO_GUIDE.md              # This file
```

---

## Key Implementation Files

### 🎯 Backend - Node Execution (The Core Logic)

**File:** `backend/src/services/nodeExecutor.ts` (523 lines)

**What it does:** Executes each node type (Google Sheets, OpenAI/Gemini, Telegram, WhatsApp, Set, Webhook)

**Key Functions:**
```typescript
// Main dispatcher
export async function executeNode(node, data) {
    switch (node.type) {
        case 'googleSheets': return executeGoogleSheets(...)
        case 'openai': return executeOpenAI(...)        // Supports Gemini!
        case 'telegram': return executeTelegram(...)
        case 'whatsapp': return executeWhatsApp(...)
        case 'set': return executeSet(...)
    }
}

// Google Sheets API integration (Lines 68-152)
async function executeGoogleSheets(node, data, config) {
    // Uses Google Sheets API v4
    // Appends form data to spreadsheet
    // Returns success with metadata
}

// OpenAI/Gemini integration (Lines 157-283)
async function executeOpenAI(node, data, config) {
    const isGemini = model.includes('gemini');

    if (isGemini) {
        // FREE Gemini API
        // https://generativelanguage.googleapis.com/v1beta/...
    } else {
        // Paid OpenAI API
        // https://api.openai.com/v1/chat/completions
    }
}

// Variable replacement (Lines 459-484)
function replaceVariables(template, data) {
    // Replaces {{body.name}} with actual values
    // Supports nested paths like {{openai.response}}
}
```

---

### 🎨 Frontend - Visual Workflow Editor

**File:** `frontend/src/components/Canvas.tsx`

**What it does:** Drag-and-drop canvas using React Flow library

**Features:**
- Visual node connection
- Real-time edge validation
- Zoom/pan controls
- Node deletion

---

**File:** `frontend/src/components/NodeConfigPanel.tsx` (1800+ lines)

**What it does:** Configuration UI for each node type

**Key Sections:**
- Settings tab (operation, model, prompts, etc.)
- Credentials tab (API keys, tokens)
- Gemini models dropdown (Lines 1049-1062)

---

### 🔄 Workflow Orchestration

**File:** `backend/src/services/executionService.ts`

**What it does:** Executes nodes in order following edges

**Algorithm:**
```typescript
1. Build node map (id → node)
2. Build edge map (source → targets)
3. Start from webhook node
4. Execute nodes following edges:
   - Execute node with current data
   - Pass output to next nodes
   - Continue until all nodes executed
5. Return final result
```

---

## Supported Node Types

| Node | Purpose | API Integration | Status |
|------|---------|-----------------|--------|
| **Webhook** | Trigger workflow from HTTP | Built-in Express | ✅ Working |
| **Google Sheets** | Store data in spreadsheet | Google Sheets API v4 | ✅ Working |
| **OpenAI** | AI text analysis | OpenAI Chat Completions | ✅ Working |
| **Gemini** | FREE AI alternative | Google Gemini API | ✅ Working |
| **Telegram** | Send messages | Telegram Bot API | ✅ Working |
| **WhatsApp** | Send messages | WhatsApp Business API | ✅ Working |
| **Set** | Transform/format data | Built-in | ✅ Working |

---

## Demo Workflow (For Professor)

### Workflow: Form → Sheets → AI → Telegram

**Use Case:** Business inquiry form with automated AI analysis

**Flow:**
1. **Webhook** receives form submission
2. **Google Sheets** logs data to spreadsheet
3. **Gemini AI** analyzes the inquiry (FREE!)
4. **Set** formats message with AI analysis
5. **Telegram** sends notification with analysis

### Live Demo Steps

#### Step 1: Show the Visual Editor

```bash
# Open browser
open http://localhost:3000
```

**Show:**
- Drag nodes from sidebar
- Connect nodes with edges
- Configure each node
- Save workflow

#### Step 2: Show the Workflow Configuration

**Webhook Node:**
- Path: `/form-submit`
- Method: POST
- No authentication

**Google Sheets Node:**
- Operation: Append
- Spreadsheet ID: `1cuVHes-...`
- Sheet: Sheet1
- Access Token: (already configured)

**OpenAI Node:**
- Model: **gemini-pro** (FREE!)
- System Prompt: "You are a business analyst..."
- User Prompt: "Analyze this inquiry: {{body.message}}"
- API Key: Your Gemini key

**Telegram Node:**
- Bot Token: (configured)
- Chat ID: Your chat ID
- Message: Uses `{{openai.response}}`

#### Step 3: Test the Workflow

```bash
# Open test form
open file:///Users/ayshaharis/Documents/main-pro/workflow-pro/test-form.html
```

**Fill in:**
- Name: John Doe
- Email: john@company.com
- Company: Acme Corp
- Category: Product Demo
- Budget: $10,000+
- Message: "Interested in automation solution"
- Urgency: High

**Click Submit**

#### Step 4: Show the Results

**Backend Logs:**
```
🔔 Webhook received: POST /form-submit
✅ Found workflow
🚀 Starting workflow execution...
[GOOGLE_SHEETS] ✅ Row appended successfully
[GEMINI] ✅ Response received
[TELEGRAM] ✅ Message sent
✅ Workflow execution complete!
```

**Google Sheet:**
- Open: https://docs.google.com/spreadsheets/d/1cuVHes-...
- Show new row with form data

**Telegram:**
- Open Telegram app
- Show message with AI analysis

---

## Running the System

### First Time Setup

```bash
cd ~/Documents/main-pro/workflow-pro/ai-workflow-automation

# Install dependencies (only needed once)
npm install

# Build backend (only needed once)
npm --prefix backend run build
```

### Daily Use

```bash
# Start everything (backend + frontend)
npm start

# Backend will be at: http://localhost:4000
# Frontend will be at: http://localhost:3000
```

### Stop the System

Press `Ctrl+C` in the terminal

---

## Quick Command Reference

```bash
# Start application
npm start

# Build backend
npm --prefix backend run build

# Test workflow via curl
curl -X POST http://localhost:4000/webhook/form-submit \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'

# Check registered workflows
curl http://localhost:4000/workflows | jq

# Check server health
curl http://localhost:4000/health
```

---

## Troubleshooting

### Token Expired Error

**Error:** "Request had invalid authentication credentials"

**Fix:**
1. Go to https://developers.google.com/oauthplayground
2. Get new Google Sheets token (expires every hour)
3. Update in workflow editor
4. See: [/tmp/refresh-google-token.md](/tmp/refresh-google-token.md)

### Backend Not Responding

**Fix:**
```bash
# Kill existing process
killall node

# Restart
npm start
```

### Port Already in Use

**Fix:**
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill

# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Restart
npm start
```

---

## Key Features to Highlight

### ✅ Visual Workflow Editor
- Drag-and-drop interface
- No coding required
- Real-time validation

### ✅ Backend Execution
- Server-side node processing
- Not browser-dependent
- Production-ready architecture

### ✅ Multiple AI Models
- OpenAI (GPT-4, GPT-3.5)
- **Gemini (FREE!)** - No credit card needed
- Easy to switch models

### ✅ Real API Integrations
- Google Sheets API v4
- Telegram Bot API
- WhatsApp Business API
- OpenAI/Gemini APIs

### ✅ Variable Substitution
- Dynamic data flow: `{{body.name}}`
- Nested paths: `{{openai.response}}`
- Fallback handling

### ✅ In-Memory Storage
- Fast workflow registration
- No database setup needed
- Perfect for demos

---

## API Endpoints

### Backend Server (Port 4000)

```
GET  /health                     # Health check
GET  /workflows                  # List all workflows
POST /workflows                  # Save workflow
POST /webhook/:path              # Trigger workflow
```

---

## Technologies Used

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **node-fetch** - HTTP client

### Frontend
- **React** - UI framework
- **React Flow** - Canvas library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling

### APIs
- Google Sheets API v4
- OpenAI Chat Completions API
- Google Gemini API
- Telegram Bot API
- WhatsApp Business Cloud API

---

## Demo Tips for Professor

### 1. Start with Architecture Overview
Show the directory structure and explain backend vs frontend separation

### 2. Show the Code
Open these key files:
- `backend/src/services/nodeExecutor.ts` - Show node execution logic
- `frontend/src/components/Canvas.tsx` - Show visual editor
- `backend/src/services/executionService.ts` - Show orchestration

### 3. Live Demonstration
1. Show visual editor
2. Submit test form
3. Show backend logs
4. Show results (Google Sheet + Telegram)

### 4. Highlight FREE Gemini
Explain that Gemini provides FREE AI analysis (15 req/min, no credit card)

### 5. Show Variable Replacement
Explain how `{{body.name}}` becomes actual data

### 6. Show Error Handling
Explain token expiration and how to refresh

---

## Next Steps (Future Enhancements)

1. **Database Integration** - Replace in-memory storage with PostgreSQL/MongoDB
2. **Auto Token Refresh** - Implement OAuth2 refresh token flow
3. **More Node Types** - Email, Slack, Discord, Notion, Airtable
4. **Conditional Logic** - If/else branching
5. **Loops** - Iterate over arrays
6. **Scheduling** - Cron-based triggers
7. **Testing** - Unit tests with Jest
8. **Deployment** - Deploy to cloud (Vercel/Railway)

---

## Quick Access Links

- **Visual Editor:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Test Form:** file:///Users/ayshaharis/Documents/main-pro/workflow-pro/test-form.html
- **Google OAuth Playground:** https://developers.google.com/oauthplayground
- **Gemini API:** https://makersuite.google.com/app/apikey

---

Good luck with your demo! 🚀
