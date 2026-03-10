# 🎯 Quick Demo Card - Print This!

## 1. Start System (30 seconds)

```bash
cd ~/Documents/main-pro/workflow-pro/ai-workflow-automation
npm start
```

**Wait for:**
```
[0] 🚀 Webhook Backend Server Started
[1] Compiled successfully!
```

---

## 2. Key URLs

| What | URL |
|------|-----|
| **Visual Editor** | http://localhost:3000 |
| **Backend API** | http://localhost:4000 |
| **Test Form** | file:///Users/ayshaharis/Documents/main-pro/workflow-pro/test-form.html |
| **Google Sheets** | https://docs.google.com/spreadsheets/d/1cuVHes-463GE6BqWbwdvmQhlNx7JGnFZ34BY7gAA-ec |

---

## 3. Code Locations (Open These)

### Backend Logic
```
backend/src/services/nodeExecutor.ts
  ↳ Line 27:  executeNode() - Main dispatcher
  ↳ Line 72:  executeGoogleSheets() - Sheets integration
  ↳ Line 157: executeOpenAI() - AI integration (Gemini!)
  ↳ Line 309: executeTelegram() - Telegram messaging
  ↳ Line 459: replaceVariables() - {{variable}} replacement
```

### Frontend Editor
```
frontend/src/components/Canvas.tsx
  ↳ Visual workflow editor with drag-and-drop

frontend/src/components/NodeConfigPanel.tsx
  ↳ Node configuration UI
  ↳ Line 1049: Gemini models dropdown
```

### Orchestration
```
backend/src/services/executionService.ts
  ↳ Line 18: executeWorkflow() - Executes nodes in order
  ↳ Line 80: while loop - Follows edges
```

---

## 4. Demo Flow

### Show Code First (2 min)
```
VS Code → backend/src/services/nodeExecutor.ts
  ↳ Show executeOpenAI() function (Line 157)
  ↳ Point out: if (isGemini) - FREE AI detection
  ↳ Show Google Sheets API call (Line 111)
  ↳ Show variable replacement (Line 459)
```

### Show Visual Editor (2 min)
```
Browser → http://localhost:3000
  ↳ Show drag-and-drop
  ↳ Click nodes to show configuration
  ↳ Show connections between nodes
```

### Live Test (1 min)
```
Browser → Open test-form.html
  ↳ Fill: Name, Email, Company, Message
  ↳ Submit
```

### Show Results (1 min)
```
Terminal → Show backend logs:
  ✅ [GOOGLE_SHEETS] Row appended
  ✅ [GEMINI] Response received
  ✅ [TELEGRAM] Message sent

Browser → Open Google Sheet
  ↳ Show new row with data

Telegram → Show notification
```

---

## 5. Current Workflow Setup

```
Form (test-form.html)
  ↓ POST /webhook/form-submit
Webhook Node
  ↓ Pass data
Google Sheets Node (saves to spreadsheet)
  ↓ Pass data
OpenAI Node (Gemini Pro - FREE AI analysis)
  ↓ Add {{openai.response}}
Set Node (format message)
  ↓ Create formatted text
Telegram Node (send notification)
  ✅ Done!
```

---

## 6. Key Features to Mention

✅ **Backend Execution** - Runs on server, not browser
✅ **Visual Editor** - No coding needed
✅ **FREE AI (Gemini)** - 15 req/min, no credit card
✅ **Real APIs** - Google Sheets, Telegram, Gemini
✅ **Variable Substitution** - {{body.name}} → actual value
✅ **Production Ready** - TypeScript, Express, React

---

## 7. Tech Stack

**Backend:** Node.js + Express + TypeScript
**Frontend:** React + React Flow + TailwindCSS
**APIs:** Google Sheets v4, Gemini, Telegram Bot

---

## 8. If Something Breaks

### Token Expired (Most Common)
```
Error: "invalid authentication credentials"
Fix: Get new token from https://developers.google.com/oauthplayground
```

### Backend Not Running
```
Terminal: npm start
Wait for: "🚀 Webhook Backend Server Started"
```

### Port Busy
```bash
lsof -ti:4000 | xargs kill
lsof -ti:3000 | xargs kill
npm start
```

---

## 9. Test Command (Backup)

If form doesn't work, use this:

```bash
curl -X POST http://localhost:4000/webhook/form-submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Demo User",
    "email": "demo@example.com",
    "company": "Demo Corp",
    "category": "Product Demo",
    "budget": "$10,000+",
    "message": "Testing workflow automation",
    "urgency": "High"
  }'
```

---

## 10. Talking Points

**Problem:** Manual data entry, no AI analysis
**Solution:** Automated workflow with free AI
**Benefits:**
- Save time (manual → automated)
- AI insights (dumb storage → smart analysis)
- Multi-channel (one submission → sheets + telegram)
- Cost effective (FREE Gemini instead of paid OpenAI)

---

## Files to Have Open During Demo

1. **Terminal** - Running `npm start`
2. **Browser Tab 1** - http://localhost:3000 (editor)
3. **Browser Tab 2** - test-form.html
4. **Browser Tab 3** - Google Sheets
5. **Telegram** - Mobile or desktop app
6. **VS Code** - nodeExecutor.ts open

---

## Demo Order (5-6 minutes)

1. ⏱️ **0:00-1:00** - Show architecture (DEMO_GUIDE.md)
2. ⏱️ **1:00-2:30** - Show code (nodeExecutor.ts)
3. ⏱️ **2:30-3:30** - Show visual editor
4. ⏱️ **3:30-4:00** - Submit test form
5. ⏱️ **4:00-5:00** - Show results (logs, sheets, telegram)
6. ⏱️ **5:00-6:00** - Q&A

---

**Need Help?** Read [DEMO_GUIDE.md](DEMO_GUIDE.md) for full details

**Token Expired?** Read [/tmp/refresh-google-token.md](/tmp/refresh-google-token.md)
