# Email Discovery → Email Sending: Complete Setup Guide

## How It Works

```
┌──────────────────┐       emails[]       ┌──────────────────┐
│  EMAIL_DISCOVERY │ ──────────────────▶  │  EMAIL_SENDING   │
│                  │                      │                  │
│ Scrapes websites │  [{email, source_url │ Sends email to   │
│ + DuckDuckGo     │   confidence_score}] │ each discovered  │
│ for emails       │                      │ address via SMTP │
└──────────────────┘                      └──────────────────┘
```

The workflow executor automatically passes the **output** of node 1 (`emails[]`) as **input** to node 2. The Email Sending node reads the `emails` array and sends to each address.

---

## Step 1: Set Up SMTP (Required for Real Sending)

Create a `.env` file in the `backend/` folder:

```env
# ── SMTP Config ──────────────────────────────────
# Option A: Gmail (use App Password, NOT your real password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM="WorkflowPro <your-email@gmail.com>"

# Option B: Outlook/Hotmail
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587
# SMTP_USER=your-email@outlook.com
# SMTP_PASS=your-password

# Option C: Custom SMTP (SendGrid, Mailgun, etc.)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=your-sendgrid-api-key

# ── MongoDB (already configured if running) ──────
MONGODB_URI=mongodb://localhost:27017/workflowpro
```

### Getting a Gmail App Password
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → **Turn ON**
3. Search "App Passwords" in account settings
4. Generate one for "Mail" → Copy the 16-char password
5. Use that as `SMTP_PASS`

> [!IMPORTANT]
> Without a `.env` file, emails are **simulated** (logged to console but not actually sent). This is safe for testing.

---

## Step 2: The Workflow JSON

### Basic: Discover + Send

```json
{
  "nodes": [
    {
      "id": "discover",
      "type": "EMAIL_DISCOVERY",
      "input": {
        "urls": ["https://www.apache.org/foundation/contact.html"],
        "keywords": ["open source"],
        "industry": "technology",
        "maxEmails": 5
      }
    },
    {
      "id": "send",
      "type": "EMAIL_SENDING",
      "input": {
        "subject": "Partnership Inquiry — WorkflowPro",
        "body": "<h2>Hello!</h2><p>We'd love to explore a potential collaboration.</p><p>Best regards,<br>WorkflowPro Team</p>"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "discover", "target": "send" }
  ]
}
```

### What happens:
1. **discover** scrapes URLs + DuckDuckGo → outputs `{ emails: [{email: "a@b.com", ...}] }`
2. The executor merges discover's output into send's input
3. **send** sees `emails[]` + `subject` + `body` → sends to every discovered email

---

## Step 3: Run It

### Option A: Via the UI
1. Open `http://localhost:3000` (frontend)
2. Create a new workflow in the editor
3. Drag an **Email Discovery** node → configure URLs/keywords/industry
4. Drag an **Email Sending** node → set subject + body
5. Connect them with an edge (Discovery → Sending)
6. Click **Execute**

### Option B: Via API (curl / PowerShell)

**PowerShell:**
```powershell
$body = @'
{
  "nodes": [
    {"id":"discover","type":"EMAIL_DISCOVERY","input":{"urls":["https://www.apache.org/foundation/contact.html"],"maxEmails":3}},
    {"id":"send","type":"EMAIL_SENDING","input":{"subject":"Hello from WorkflowPro","body":"<p>This is a test email.</p>"}}
  ],
  "edges": [{"id":"e1","source":"discover","target":"send"}]
}
'@
Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/workflows/execute" -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
```

**Bash/curl:**
```bash
curl -X POST http://localhost:5000/api/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {"id":"discover","type":"EMAIL_DISCOVERY","input":{"urls":["https://www.apache.org/foundation/contact.html"],"maxEmails":3}},
      {"id":"send","type":"EMAIL_SENDING","input":{"subject":"Hello from WorkflowPro","body":"<p>This is a test email.</p>"}}
    ],
    "edges": [{"id":"e1","source":"discover","target":"send"}]
  }'
```

---

## Step 4: Verify Results

### Check Backend Console Logs

You should see output like:
```
[EmailDiscovery] Starting email discovery...
[EmailDiscovery] 📌 User provided 1 direct URL(s)
[EmailDiscovery] [1/1] Fetching: https://www.apache.org/foundation/contact.html
[EmailDiscovery]   ✓ Found 3 email(s)
[EmailDiscovery] ✅ Discovered 3 unique valid email(s)
[EmailDiscovery] Saved 3/3 to database
[EmailSending] Starting execution...
Attempting to send email to fundraising@apache.org...
Attempting to send email to apache@apache.org...
Attempting to send email to press@apache.org...
```

### Check the API Response
```json
{
  "status": "success",
  "results": [
    {
      "nodeId": "discover",
      "nodeType": "EMAIL_DISCOVERY",
      "result": {
        "status": "success",
        "data": {
          "emails": [
            {"email": "fundraising@apache.org", "confidence_score": 1.0},
            {"email": "apache@apache.org", "confidence_score": 1.0}
          ],
          "returnedCount": 2
        }
      }
    },
    {
      "nodeId": "send",
      "nodeType": "EMAIL_SENDING",
      "result": {
        "status": "success",
        "data": {
          "sentCount": 2,
          "status": "sent"
        }
      }
    }
  ]
}
```

---

## Data Flow Diagram

```
EMAIL_DISCOVERY output:                    EMAIL_SENDING input:
─────────────────────                      ────────────────────
{                                          {
  emails: [                    ──merge──▶    emails: [{ email }]    ✅ auto-filled
    { email, source_url,                     subject: "Hello"       ✅ from config
      confidence_score }                     body: "<p>Hi</p>"      ✅ from config
  ],                                       }
  totalScraped: 3,
  uniqueCount: 3
}
```

---

## Configuration Reference

### Email Discovery Node Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `urls` | string[] | No | Direct URLs to scrape for emails |
| `keywords` | string[] | No | DuckDuckGo search keywords |
| `industry` | string | No | `technology`, `education`, `business`, `startup`, `ngo`, `corporate`, `opensource` |
| `targetDomains` | string[] | No | Only keep emails from these domains |
| `maxEmails` | number | No | Limit results (default: 50) |

### Email Sending Node Inputs

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | **Yes** | Email subject line |
| `body` | string | **Yes** | Email body (supports HTML) |
| `recipient` | string | No | Single recipient (overrides emails[]) |
| `emails` | array | No | Array of `{email}` objects (auto-filled from Discovery) |
| `attachments` | array | No | File attachments |

---

## Safe Testing (No Real Emails Sent)

If you **don't** create a `.env` file with SMTP credentials, the Email Sending node uses a **JSON transport** — it simulates sending and logs the email content to the console without actually delivering anything. This is perfect for testing the full workflow pipeline.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `Missing required inputs: subject or body` | Email Sending node has no subject/body configured | Add `subject` and `body` to the send node's input |
| `No recipients found, skipping` | Discovery found 0 emails | Check URLs are public, try different keywords |
| `Email sending failed: Invalid login` | Wrong SMTP credentials | Verify SMTP_USER/SMTP_PASS in `.env`, use App Password for Gmail |
| Discovery works but emails not sent | Missing edge between nodes | Add `{"source":"discover","target":"send"}` to edges |
