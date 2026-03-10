# Testing Guide - Business Workflow Automation

This guide will help you test the complete workflow: **Form → Google Sheets → AI Analysis → WhatsApp/Telegram**

---

## Quick Start (3 Steps)

### Step 1: Start the Application

```bash
cd ai-workflow-automation
npm start
```

This will start:
- **Frontend**: http://localhost:3000 (Visual workflow editor)
- **Backend**: http://localhost:4000 (Webhook receiver)

### Step 2: Open the Test Form

Open the test form in your browser:
```bash
open test-form.html
```

Or manually open: `ai-workflow-automation/test-form.html`

### Step 3: Submit the Form

Fill out the form and click "Submit Form". The workflow will automatically:
1. ✅ Save data to Google Sheets
2. ✅ Analyze submission with OpenAI
3. ✅ Send notification to WhatsApp/Telegram

---

## Detailed Setup Instructions

### Option A: Setup Workflow in Visual Editor

1. **Open the editor**: http://localhost:3000

2. **Create a new workflow** with these nodes:

#### Node 1: Webhook (Form Trigger)
- **Settings**:
  - Path: `/form-submit`
  - Method: `POST`
  - Response Mode: `Immediate`

#### Node 2: Google Sheets (Save Data)
- **Settings**:
  - Operation: `Append Row`
  - Spreadsheet ID: `YOUR_SPREADSHEET_ID` (from Google Sheets URL)
  - Sheet Name: `Sheet1` (or whatever tab name you have - e.g., "Submissions", "Form Data")
  - Range: `A:H`
- **Credentials**:
  - Access Token: `ya29.a0...` (from [OAuth Playground](https://developers.google.com/oauthplayground))

#### Node 3: OpenAI (AI Analysis)
- **Settings**:
  - Operation: `Chat Completion`
  - Model: `gpt-4` or `gpt-3.5-turbo`
  - Temperature: `0.7` (0 = focused, 1 = creative)

  - **System Prompt** (Sets AI's role and behavior):
    ```
    You are a professional business analyst assistant.
    Analyze customer inquiries and provide clear, actionable insights in a concise format.
    Always structure your response with numbered points.
    ```

  - **User Prompt** (The actual task with data from previous nodes):
    ```
    Analyze this business inquiry and provide:
    1. Summary of the request
    2. Urgency assessment (Low/Medium/High)
    3. Recommended next action

    Customer Details:
    - Name: {{body.name}}
    - Company: {{body.company}}
    - Email: {{body.email}}
    - Phone: {{body.phone}}

    Inquiry:
    - Category: {{body.category}}
    - Budget: {{body.budget}}
    - Urgency: {{body.urgency}}
    - Message: {{body.message}}
    ```

- **Credentials**:
  - API Key: `sk-...` (from [OpenAI Platform](https://platform.openai.com))

#### Node 4: Set (Format Message)
- **Settings**:
  - Add Field:
    - Name: `formattedMessage`
    - Value:
      ```
      🔔 NEW BUSINESS INQUIRY

      👤 Contact Details:
      Name: {{body.name}}
      Email: {{body.email}}
      Phone: {{body.phone}}
      Company: {{body.company}}

      📋 Inquiry Details:
      Type: {{body.category}}
      Budget: {{body.budget}}
      Urgency: {{body.urgency}}

      💬 Message:
      {{body.message}}

      

      🤖 AI Analysis:
      {{openai.response}}

      ⏰ Received: {{body.timestamp}}
      ```

#### Node 5: WhatsApp (Optional - if you have WhatsApp API)
- **Settings**:
  - Operation: `Send Message`
  - Phone Number: `+1234567890` (your number)
  - Message: `{{formattedMessage}}`
- **Credentials**:
  - Access Token: `EAAxxxxxxxxxx`
  - Phone Number ID: `123456789012345`

#### Node 6: Telegram (Recommended for testing)
- **Settings**:
  - Chat ID: `YOUR_CHAT_ID`
  - Message: `{{formattedMessage}}`
- **Credentials**:
  - Bot Token: `123456:ABC-DEF...` (from [@BotFather](https://t.me/botfather))

3. **Connect the nodes**:
   - Webhook → Google Sheets
   - Google Sheets → OpenAI
   - OpenAI → Set
   - Set → WhatsApp (optional)
   - Set → Telegram

4. **Save the workflow**

---

## How to Get API Credentials

### 1. Google Sheets OAuth Token

1. Go to https://developers.google.com/oauthplayground
2. Click the gear icon (⚙️) in top-right
3. Check "Use your own OAuth credentials" (optional)
4. In Step 1, find "Google Sheets API v4"
5. Select: `https://www.googleapis.com/auth/spreadsheets`
6. Click "Authorize APIs"
7. Sign in with your Google account
8. Click "Exchange authorization code for tokens"
9. Copy the **Access token** (starts with `ya29.`)
10. Paste into Google Sheets node credentials

**Note**: Tokens expire after 1 hour. Use the refresh token for longer testing, or just get a new token when needed.

### 2. Create Google Spreadsheet

1. Go to https://sheets.google.com
2. Create a new spreadsheet
3. Name it "Workflow Submissions"
4. Add headers in row 1: `Name | Email | Phone | Company | Category | Budget | Message | Urgency`
5. Copy the spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                          ↑ This is your Spreadsheet ID ↑
   ```

### 3. OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a name like "Workflow Testing"
4. Copy the key (starts with `sk-`)
5. **Important**: Save it immediately - you can't view it again!

### 4. Telegram Bot (Easy & Free)

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow instructions to name your bot
4. Copy the **Bot Token** (e.g., `123456789:ABC-DEF...`)
5. To get your **Chat ID**:
   - Send a message to your bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `"chat":{"id": 123456789}` - this is your Chat ID

### 5. WhatsApp Business API (Optional - More Complex)

1. Go to https://business.facebook.com
2. Create a Meta Business account
3. Add WhatsApp product
4. Get a test phone number
5. Copy **Access Token** and **Phone Number ID** from API Setup
6. **Note**: You can only send messages to approved numbers in test mode

---

## Testing Methods

### Method 1: HTML Test Form (Recommended)

```bash
# Just open the file in your browser
open ai-workflow-automation/test-form.html
```

**Benefits**:
- User-friendly interface
- Pre-filled business fields
- Visual feedback
- Exactly simulates real form submission

### Method 2: cURL Command Line

```bash
curl -X POST http://localhost:4000/webhook/form-submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john.smith@acme.com",
    "phone": "+1-555-123-4567",
    "company": "Acme Corporation",
    "category": "Product Demo",
    "budget": "$5,000 - $10,000",
    "message": "We are interested in implementing your workflow automation platform for our sales team. We have about 50 users and need custom integrations with our CRM.",
    "urgency": "High",
    "timestamp": "2024-01-23T10:30:00Z"
  }'
```

### Method 3: Postman / Insomnia

1. Create a new POST request
2. URL: `http://localhost:4000/webhook/form-submit`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "name": "Jane Doe",
     "email": "jane@example.com",
     "phone": "+1-555-987-6543",
     "company": "Tech Startup Inc",
     "category": "Partnership",
     "budget": "Over $50,000",
     "message": "Looking to partner on enterprise solutions",
     "urgency": "Medium",
     "timestamp": "2024-01-23T15:45:00Z"
   }
   ```

### Method 4: JavaScript Fetch (Browser Console)

```javascript
fetch('http://localhost:4000/webhook/form-submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: "Alice Johnson",
    email: "alice@business.com",
    phone: "+1-555-111-2222",
    company: "Innovation Labs",
    category: "Technical Support",
    budget: "$1,000 - $5,000",
    message: "Need help integrating with Salesforce API",
    urgency: "High",
    timestamp: new Date().toISOString()
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

---

## Verification Checklist

After submitting the form, verify each step:

### ✅ Step 1: Backend Received Request
Check the backend console (Terminal where `npm start` is running):
```
[WEBHOOK] Received POST /webhook/form-submit
[EXECUTE] webhook node: node-1
[EXECUTE] googleSheets node: node-2
[GOOGLE_SHEETS] Operation: append
[GOOGLE_SHEETS] Successfully appended 1 rows
```

### ✅ Step 2: Google Sheets Updated
1. Open your Google Sheet
2. New row should appear with form data
3. Check all columns are populated correctly

### ✅ Step 3: AI Analysis Complete
Check backend console for:
```
[EXECUTE] openai node: node-3
[OPENAI] Operation: chat
[OPENAI] Prompt: Analyze this business inquiry...
```

### ✅ Step 4: Message Formatted
Check backend console for:
```
[EXECUTE] set node: node-4
[SET] Set formattedMessage = 🔔 NEW BUSINESS INQUIRY...
```

### ✅ Step 5: Telegram Message Sent
1. Check your Telegram bot chat
2. You should receive the formatted message
3. Backend console shows:
   ```
   [TELEGRAM] Sending message to chat 123456789
   [TELEGRAM] Message sent successfully
   ```

### ✅ Step 6: WhatsApp Message Sent (if configured)
1. Check WhatsApp on your phone
2. You should receive the message
3. Backend console shows:
   ```
   [WHATSAPP] Sending request to WhatsApp API...
   [WHATSAPP] Message sent successfully, ID: wamid.xxx
   ```

---

## Troubleshooting

### Problem: "Failed to fetch" or "Network Error"

**Solution**: Make sure backend is running
```bash
# Check if backend is running
curl http://localhost:4000/health

# Should return: {"status":"ok","timestamp":...}
```

### Problem: "Google Sheets API error: Invalid credentials"

**Solutions**:
1. Token expired - get a new one from OAuth Playground
2. Check spreadsheet ID is correct
3. Ensure token has correct scope: `https://www.googleapis.com/auth/spreadsheets`

### Problem: "Google Sheets API error: The caller does not have permission"

**Solution**:
1. Make sure the spreadsheet is created by the same Google account used to generate the token
2. OR share the spreadsheet with the email used for OAuth

### Problem: WhatsApp "Invalid phone number"

**Solutions**:
1. Include country code: `+12345678900` or `12345678900`
2. Remove spaces, dashes, parentheses
3. For testing, use a phone number registered with your WhatsApp Business account

### Problem: Telegram "Bad Request: chat not found"

**Solution**:
1. Make sure you've sent at least one message to your bot first
2. Get chat ID from `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
3. Check bot token is correct

### Problem: OpenAI "Incorrect API key"

**Solution**:
1. Verify API key starts with `sk-`
2. Check for extra spaces or line breaks
3. Make sure you have credits in your OpenAI account

### Problem: Form submits but no data in Google Sheets

**Possible causes**:
1. Workflow not saved in the editor
2. Nodes not connected properly (check edges)
3. Google Sheets node credentials missing
4. Check backend console for errors

---

## Example Test Scenarios

### Scenario 1: High-Priority Demo Request
```json
{
  "name": "Sarah Martinez",
  "email": "sarah.martinez@enterprise.com",
  "phone": "+1-555-234-5678",
  "company": "Enterprise Solutions LLC",
  "category": "Product Demo",
  "budget": "Over $50,000",
  "message": "We need an urgent demo for our executive team next week. We're evaluating workflow automation tools for 200+ employees across 5 departments.",
  "urgency": "High"
}
```

### Scenario 2: Technical Support Issue
```json
{
  "name": "Mike Chen",
  "email": "mike.chen@techco.io",
  "phone": "+1-555-345-6789",
  "company": "TechCo",
  "category": "Technical Support",
  "budget": "Under $1,000",
  "message": "API integration failing with error 500. Need immediate assistance as this is blocking our production deployment.",
  "urgency": "High"
}
```

### Scenario 3: Partnership Inquiry
```json
{
  "name": "Lisa Wong",
  "email": "lisa@partners-inc.com",
  "phone": "+1-555-456-7890",
  "company": "Partners Inc",
  "category": "Partnership",
  "budget": "$10,000 - $50,000",
  "message": "Interested in white-label partnership. We serve 500+ SMB clients who could benefit from your workflow platform.",
  "urgency": "Medium"
}
```

### Scenario 4: General Pricing Inquiry
```json
{
  "name": "Tom Anderson",
  "email": "tom@smallbiz.com",
  "phone": "+1-555-567-8901",
  "company": "Small Business Co",
  "category": "Pricing",
  "budget": "$1,000 - $5,000",
  "message": "Looking for pricing information for a team of 10 users. What features are included in each plan?",
  "urgency": "Low"
}
```

---

## Advanced Testing

### Load Testing (Multiple Submissions)

Create a bash script to submit multiple forms:

```bash
#!/bin/bash
# save as test-load.sh

for i in {1..10}
do
  curl -X POST http://localhost:4000/webhook/form-submit \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test User $i\",
      \"email\": \"test$i@example.com\",
      \"phone\": \"+1-555-000-000$i\",
      \"company\": \"Test Company $i\",
      \"category\": \"General Inquiry\",
      \"budget\": \"Under \$1,000\",
      \"message\": \"This is test submission number $i\",
      \"urgency\": \"Low\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }"
  echo "Submitted form $i"
  sleep 2
done
```

Run it:
```bash
chmod +x test-load.sh
./test-load.sh
```

### Monitor Real-Time Logs

Watch the workflow execution in real-time:

```bash
# In one terminal
cd ai-workflow-automation
npm start

# In another terminal
tail -f backend/logs/workflow-execution.log  # if you add logging
```

---

## Success Indicators

Your workflow is working correctly if you see:

1. ✅ **200 OK** response from webhook
2. ✅ **New row** in Google Sheets with all form data
3. ✅ **OpenAI response** in backend logs
4. ✅ **Formatted message** with AI analysis
5. ✅ **Telegram notification** received
6. ✅ **WhatsApp message** received (if configured)
7. ✅ **Run history** shows successful execution in editor

---

## Next Steps

Once testing is complete, you can:

1. **Customize the form** - Add/remove fields as needed
2. **Adjust AI prompts** - Tailor analysis to your business needs
3. **Add more nodes** - Include Slack, email, or database operations
4. **Create multiple workflows** - Different forms trigger different workflows
5. **Deploy to production** - Host on Vercel (frontend) + Railway (backend)

---

## Support Resources

- **Google Sheets API Docs**: https://developers.google.com/sheets/api
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Telegram Bot API**: https://core.telegram.org/bots/api

Need help? Check the backend console logs for detailed error messages.
