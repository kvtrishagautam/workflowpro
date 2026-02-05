# Business Automation Workflow Guide: New Lead Processing

This guide walks you through creating a "New Lead Processing" workflow. This automation will receive a new lead via Webhook, filter out spam, add the lead to **Google Sheets**, notify your team on **Slack**, and send a welcome **Email** to the lead.

## Workflow Overview

**Nodes**: 5
**Flow**: `Webhook` -> `Filter` -> `Google Sheets` -> `Slack` -> `Email`

---

## Step 1: Create the Workflow

1.  Open **WorkflowPro**.
2.  Click **"New Workflow"**.
3.  Name it **"New Lead Processing"**.
4.  You will see an empty canvas.

## Step 2: Add Nodes

Drag the following nodes from the **Node Palette** (left sidebar) onto the canvas:

1.  **Webhook** (Trigger)
2.  **Filter** (Logic)
3.  **Google Sheets** (Productivity)
4.  **Slack** (Communication)
5.  **Email** (Communication)

Arrange them in a logical left-to-right flow.

## Step 3: Connect Nodes

To connect nodes, click and drag from the **bottom handle** (Output) of one node to the **top handle** (Input) of the next node.

1.  Connect **Webhook** Output ➔ **Filter** Input.
2.  Connect **Filter** Output ➔ **Google Sheets** Input.
3.  Connect **Google Sheets** Output ➔ **Slack** Input.
4.  Connect **Slack** Output ➔ **Email** Input.

---

## Step 4: Configure Nodes

Click on each node to open its **Configuration Panel**.

### 1. Webhook Node (Trigger)
*   **Label**: `New Lead Form`
*   **Path**: `/new-lead` (This will generate a URL like `http://localhost:4000/api/webhook/new-lead`)
*   **Method**: `POST`
*   **Authentication**: `None` (for public forms) or `API Key` (for secure sources).

**Sample Payload for testing**:
```json
{
  "email": "lead@example.com",
  "name": "Alice Smith",
  "company": "Tech Corp",
  "message": "Interested in enterprise plan."
}
```

### 2. Filter Node (Spam Check)
ensure we only process valid business emails.

*   **Label**: `Filter Spam`
*   **Combine Conditions**: `AND`
*   **Conditions**:
    *   **Field**: `data.email`
    *   **Operator**: `notContains`
    *   **Value**: `gmail.com` (Example: reject generic emails if B2B)
    *   *Click "+ Add Condition"*
    *   **Field**: `data.email`
    *   **Operator**: `isNotEmpty`

### 3. Google Sheets Node (Log Data)
Add the lead to a spreadsheet.

*   **Prerequisite**:
    1.  Create a new Google Sheet.
    2.  Name the tabs/sheets (e.g., "Leads").
    3.  Add headers in Row 1: `Name`, `Email`, `Company`, `Date`.
*   **Configuration**:
    *   **Operation**: `Append Row`
    *   **Spreadsheet ID**: Copy this from your browser URL.
        *   *URL format*: `docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`**`/edit`
        *   *ID is the bold part.* (**Note**: The URL only tells the system *where* the sheet is. You still need Credentials below to give it *permission* to write.)
    *   **Sheet Name**: `Leads` (Must match exact tab name)
    *   **Range**: `A:D`
    *   **Values (JSON)**: Map variables from the Webhook.
        ```json
        [
          "${data.name}",
          "${data.email}",
          "${data.company}",
          "${new Date().toISOString()}"
        ]
        ```
*   **Credentials**:
    *   Go to the **Credentials** tab in the node panel.
    *   Click "Connect Google Sheets" or paste your **Service Account JSON** / **OAuth Token**.

### 4. Slack Node (Team Notification)
Alert the sales team.

*   **Operation**: `Send Message`
*   **Channel**: `#sales-leads`
*   **Message**:
    ```text
    🚨 *New Lead Received!*
    
    *Name*: ${data.name}
    *Company*: ${data.company}
    *Email*: ${data.email}
    
    _Added to Google Sheets._
    ```
*   **Credentials**:
    *   Go to **Credentials** tab.
    *   Enter your **Bot User OAuth Token** (starts with `xoxb-`).

### 5. Email Node (Auto-Response)
Send a confirmation to the lead.

*   **Operation**: `Send Email`
*   **To**: `${data.email}`
*   **Subject**: `Thanks for contacting us, ${data.name}!`
*   **Body Type**: `HTML`
*   **Body**:
    ```html
    <h1>Hi ${data.name},</h1>
    <p>We received your inquiry regarding <b>${data.company}</b>.</p>
    <p>A member of our team will be in touch shortly.</p>
    ```
*   **Credentials**:
    *   Enter SMTP settings or API Key (e.g., SendGrid/Mailgun) in the **Credentials** tab.

---

## Step 5: Activate & Test

1.  Toggle the **Workflow Status** to **Active** (Top right switch).
2.  Send a test POST request to your Webhook URL using Postman or curl:
    ```bash
    curl -X POST http://localhost:4000/api/webhook/new-lead \
      -H "Content-Type: application/json" \
      -d '{"email": "alice@techcorp.com", "name": "Alice", "company": "Tech Corp"}'
    ```
3.  **Verify**:
    *   Check Google Sheets for the new row.
    *   Check Slack for the notification.
    *   Check the provided email inbox.

## Appendix: How to Get Google Sheets Credentials

For server-side automation, using a **Service Account** is recommended as it doesn't require manual login refresh.

### Method 1: Service Account (Recommended)

1.  **Go to Google Cloud Console**: [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a New Project**: Click the project dropdown (top left) > "New Project" > Name it (e.g., "Workflow Automation") > Create.
3.  **Enable Sheets API**:
    *   Go to "APIs & Services" > "Library".
    *   Search for "Google Sheets API".
    *   Click "Enable".
4.  **Create Service Account**:
    *   Go to "APIs & Services" > "Credentials".
    *   Click "+ CREATE CREDENTIALS" > "Service Account".
    *   Name it (e.g., "Workflow Bot") > "Create and Continue".
    *   Skip role assignment (optional) > "Done".
5.  **Generate JSON Key**:
    *   Click on the newly created email address (e.g., `workflow-bot@project-id.iam.gserviceaccount.com`).
    *   Go to the "Keys" tab.
    *   Click "Add Key" > "Create new key" > Select "JSON" > "Create".
    *   A JSON file will download to your computer.
6.  **Share Sheet with Bot**:
    *   Open your Google Sheet.
    *   Click "Share" (top right).
    *   Paste the **client_email** from your JSON file (the one ending in `@...iam.gserviceaccount.com`).
    *   Give it "Editor" access.
7.  **Use in WorkflowPro**:
    *   Open the downloaded JSON file with a text editor.
    *   Copy the entire content.
    *   Paste it into the **"Service Account JSON"** field in the Google Sheets node credentials.

### Method 2: OAuth Token (For personal use)

If you have a "Connect with Google" button in the node settings, simply click that. If manually configuring:

1.  Go to [Google OAuth Playground](https://developers.google.com/oauthplayground/).
2.  Select "Google Sheets API v4" scopes.
3.  Authorize and get the "Access Token".
4.  **Note**: These tokens expire quickly (1 hour) without a refresh token handling mechanism, so Service Account is better for backend automation.

### How to Get Email Credentials

You have a few options depending on what email service you use:

#### Option 1: Gmail (Free, for personal testing)
You cannot use your normal password. You must generate an "App Password".
1.  Go to your [Google Account Security page](https://myaccount.google.com/security).
2.  Enable **2-Step Verification** if not already on.
3.  Search for **"App passwords"** in the top search bar (or look under 2-Step Verification).
4.  Create a new app password (name it "Workflow").
5.  **Use these settings**:
    *   **Host**: `smtp.gmail.com`
    *   **Port**: `587`
    *   **User**: Your Gmail address
    *   **Password**: The 16-character App Password you just generated.

#### Option 2: SendGrid (Recommended for business)
1.  Sign up for [SendGrid](https://sendgrid.com/) (Free tier available).
2.  Go to **Settings** > **API Keys**.
3.  Click **Create API Key** > Give it "Full Access" > Copy the key.
4.  **Use these settings**:
    *   **Host**: `smtp.sendgrid.net`
    *   **Port**: `587`
    *   **User**: `apikey` (literally type "apikey" as the username)
    *   **Password**: Your API Key (starts with `SG...`).

#### Option 3: Mailgun
1.  Sign up for [Mailgun](https://www.mailgun.com/).
2.  Go to **Sending** > **Job Settings** to find your SMTP credentials.
3.  **Use these settings**:
    *   **Host**: `smtp.mailgun.org`
    *   **Port**: `587`
    *   **User**: `postmaster@yourdomain.com`
    *   **Password**: Your generated SMTP password.
