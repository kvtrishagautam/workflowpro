# AI Workflow Automation - Production Workflows

## 🎬 Workflows Implemented

### 1. News Monitor Workflow
**Automated news tracking with AI-powered importance analysis**

**Flow:**
```
⏰ Schedule (every hour)
  ↓
🌐 HTTP Request (fetch latest news)
  ↓
🔍 Filter (only new articles)
  ↓
🤖 OpenAI/Gemini (analyze importance & summarize)
  ↓
🔀 IF Condition (important?)
  ├─ YES → ✈️ Telegram (send urgent alert)
  └─ NO → 📊 Google Sheets (log for later)
```

**Use Case:** Monitor industry news, competitor updates, or stock market news with automated importance scoring. Only get notified for critical updates while logging everything for later review.

**Trigger:** Time-based (Schedule node)
- Frequency: Every hour
- Automatic execution

---

### 2. Business Form Workflow
**Lead generation with AI-powered qualification**

**Flow:**
```
📥 Webhook (form submission)
  ↓
📊 Google Sheets (log inquiry)
  ↓
🤖 Gemini AI (analyze customer - FREE!)
  ↓
📝 Set (format message)
  ↓
✈️ Telegram (send notification)
```

**Use Case:** Automatically analyze every business inquiry, log to spreadsheet for tracking, and get instant Telegram notifications with AI-powered lead qualification. Perfect for small businesses and freelancers.

**Trigger:** Webhook endpoint
- Endpoint: `POST http://localhost:4000/webhook/form-submit`
- Real-time execution on form submission

**Sample Form Data:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "budget": "$10,000",
  "message": "Need AI integration for workflow automation"
}
```

---

## 🔧 Nodes Configured

### 1. Schedule Node
**Time-based workflow triggers**

Used in: News Monitor Workflow

**Configuration:**
- Trigger Type: Interval
- Frequency: Every 1 hour
- Enable/Disable: Toggle scheduling
- Timezone: System default

**Options:**
- Interval mode (every X minutes/hours/days)
- Cron expression mode
- Specific time mode

---

### 2. Webhook Node
**HTTP endpoint triggers**

Used in: Business Form Workflow

**Configuration:**
- Path: `/form-submit`
- Method: POST (accepts all methods)
- Authentication: None (configurable)

**Receives:**
- Request body (JSON)
- Query parameters
- Headers

**Data Structure:**
```json
{
  "webhook": {
    "body": { ...form data... },
    "query": {},
    "headers": {}
  }
}
```

---

### 3. HTTP Request Node
**REST API calls**

Used in: News Monitor Workflow

**Configuration:**
- Method: GET
- URL: News API endpoint
- Headers: Custom headers (API keys)
- Authentication: Bearer token / API key

**Returns:**
```json
{
  "http": {
    "body": { ...API response... },
    "statusCode": 200,
    "headers": {}
  }
}
```

---

### 4. Filter Node
**Array filtering with conditions**

Used in: News Monitor Workflow

**Configuration:**
- Input Array: `{{http.body.articles}}`
- Condition: `publishedAt` > last check time
- Operator: `larger`
- Logic: AND/OR for multiple conditions

**Operators:**
- equal, notEqual
- larger, largerEqual, smaller, smallerEqual
- contains, notContains
- startsWith, endsWith
- isEmpty, isNotEmpty

**Returns:** Filtered array of new articles

---

### 5. OpenAI/Gemini Node
**AI-powered analysis**

Used in: Both workflows

**Configuration (Gemini - FREE):**
```json
{
  "model": "gemini-1.5-flash",
  "apiKey": "YOUR_GEMINI_API_KEY",
  "systemInstruction": "You are an AI assistant that analyzes content.",
  "prompt": "Analyze this article: {{http.body.title}}, {{http.body.description}}",
  "temperature": 0.7,
  "maxOutputTokens": 1024
}
```

**Configuration (OpenAI - PAID):**
```json
{
  "model": "gpt-3.5-turbo",
  "apiKey": "YOUR_OPENAI_API_KEY",
  "systemPrompt": "You are an AI assistant.",
  "userPrompt": "Analyze this customer: {{webhook.body.name}}, {{webhook.body.message}}",
  "temperature": 0.7,
  "maxTokens": 500
}
```

**Variable Replacement:**
- Use `{{node.field}}` syntax in prompts
- Example: `{{webhook.body.name}}`, `{{http.body.title}}`

**Returns:**
```json
{
  "openai": {
    "response": "AI-generated analysis text",
    "model": "gemini-1.5-flash",
    "tokensUsed": 250
  }
}
```

---

### 6. Conditional (IF) Node
**Branch workflow based on conditions**

Used in: News Monitor Workflow

**Configuration:**
- Condition Field: `{{openai.response}}`
- Operator: `contains`
- Value: "important" or "urgent"
- Logic: AND/OR for multiple conditions

**Output Connections:**
- TRUE path → Telegram notification
- FALSE path → Google Sheets logging

**Example Condition:**
```json
{
  "field": "{{openai.response}}",
  "operator": "contains",
  "value": "important"
}
```

---

### 7. Google Sheets Node
**Spreadsheet operations**

Used in: Both workflows

**Configuration:**
- Operation: Append Row
- Spreadsheet ID: `YOUR_SPREADSHEET_ID`
- Sheet Name: `Sheet1`
- Range: `A:F`

**Values (Business Form):**
```json
{
  "values": [
    "{{webhook.body.name}}",
    "{{webhook.body.email}}",
    "{{webhook.body.phone}}",
    "{{webhook.body.company}}",
    "{{webhook.body.budget}}",
    "{{webhook.body.message}}"
  ]
}
```

**Values (News Monitor):**
```json
{
  "values": [
    "{{http.body.title}}",
    "{{http.body.url}}",
    "{{http.body.publishedAt}}",
    "{{openai.response}}"
  ]
}
```

**Returns:**
```json
{
  "googleSheets": {
    "status": "success",
    "rowNumber": 42,
    "range": "Sheet1!A42:F42"
  }
}
```

**Operations Available:**
- Append row
- Read rows
- Update row
- Delete row
- Clear sheet

---

### 8. Set Node
**Data transformation and formatting**

Used in: Business Form Workflow

**Configuration:**
- Mode: Manual values
- Fields to set:
  - `summary.customerName` = `{{webhook.body.name}}`
  - `summary.analysis` = `{{openai.response}}`
  - `summary.priority` = `High`
  - `summary.timestamp` = `{{$now}}`

**Example:**
```json
{
  "fields": [
    {
      "name": "summary.customerName",
      "value": "{{webhook.body.name}}"
    },
    {
      "name": "summary.analysis",
      "value": "{{openai.response}}"
    },
    {
      "name": "summary.priority",
      "value": "High"
    }
  ]
}
```

**Returns:** Structured data object ready for next node

---

### 9. Telegram Node
**Send messages via Telegram Bot**

Used in: Both workflows

**Configuration:**
```json
{
  "botToken": "YOUR_TELEGRAM_BOT_TOKEN",
  "chatId": "YOUR_CHAT_ID",
  "message": "🚨 Important News Alert!\n\n{{http.body.title}}\n\nAnalysis: {{openai.response}}",
  "parseMode": "Markdown"
}
```

**Message with Variables (Business Form):**
```
📬 New Lead Received!

Name: {{webhook.body.name}}
Email: {{webhook.body.email}}
Company: {{webhook.body.company}}
Budget: {{webhook.body.budget}}

🤖 AI Analysis:
{{openai.response}}

Priority: {{summary.priority}}
```

**Message with Variables (News Monitor):**
```
🚨 Important News Alert!

{{http.body.title}}

Summary: {{openai.response}}

Link: {{http.body.url}}
```

**Returns:**
```json
{
  "telegram": {
    "status": "success",
    "messageId": 12345,
    "chatId": "YOUR_CHAT_ID"
  }
}
```

**Operations Available:**
- Send text message
- Send photo
- Send document
- Send location

**Parse Modes:**
- Markdown
- HTML
- None

---

## 🔄 Variable Replacement System

**Syntax:** `{{node.field.subfield}}`

**Examples:**
```javascript
// Webhook data
"{{webhook.body.name}}"
"{{webhook.body.email}}"

// HTTP response
"{{http.body.title}}"
"{{http.body.articles[0].title}}"

// AI response
"{{openai.response}}"

// Google Sheets
"{{googleSheets.rowNumber}}"

// Set node output
"{{summary.customerName}}"
"{{summary.analysis}}"

// Nested access
"{{http.body.user.profile.name}}"
```

---

## 📊 Workflow Statistics

**News Monitor Workflow:**
- Total Nodes: 7
- Trigger Type: Schedule (hourly)
- Integrations: News API, Gemini AI, Telegram, Google Sheets
- Execution: Automated every hour
- Output: Conditional (Telegram or Sheets)

**Business Form Workflow:**
- Total Nodes: 5
- Trigger Type: Webhook (real-time)
- Integrations: Google Sheets, Gemini AI (FREE), Telegram
- Execution: On-demand (form submission)
- Output: Telegram notification with AI analysis

---

## 🚀 Running the Workflows

### Backend Setup
```bash
cd ai-workflow-automation/backend
npm install
npm run dev
```
Backend runs on: `http://localhost:4000`

### Frontend Setup
```bash
cd ai-workflow-automation/frontend
npm install
npm start
```
Frontend runs on: `http://localhost:3000`

### Environment Variables
Create `.env` file in backend:
```env
PORT=4000
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=your_telegram_token
GOOGLE_SHEETS_CREDENTIALS=your_oauth_json
```

### Trigger Business Form Workflow
```bash
curl -X POST http://localhost:4000/webhook/form-submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "budget": "$10,000",
    "message": "Need AI integration"
  }'
```

---

**Created by:** Aysha Haris
**Project:** AI Workflow Automation System
**Date:** February 2026
**Status:** Production Ready ✅
