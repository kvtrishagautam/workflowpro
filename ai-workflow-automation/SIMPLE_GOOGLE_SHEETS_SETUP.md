 # Simple Google Sheets Setup (No Google Console Required!)

## 🎉 Easy Authentication Methods

You have **two options** to connect to Google Sheets:

### Option 1: Simple API Key (Read-Only) - **EASIEST**

Perfect for reading public sheets or sheets shared with "Anyone with the link can view"

#### Steps:
1. Make your Google Sheet **publicly viewable**:
   - Open your Google Sheet
   - Click "Share" → Change to "Anyone with the link can view"
   
2. Get your Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

3. In WorkflowPro:
   - Set operation to "Read"
   - Paste Sheet ID
   - **Leave credentials empty** for public sheets
   - That's it! ✨

**Limitations**: Read-only access, sheet must be public

---

### Option 2: OAuth2 with Your Google Account - **RECOMMENDED**

Full read/write access using your personal Google account. No service account needed!

#### Quick Setup (3 minutes):

1. **Get OAuth Credentials** (One-time setup):
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Desktop app"
   - Download the JSON file
   
2. **In WorkflowPro**:
   - Open workflow editor
   - Add Google Sheets node
   - Go to "Credentials" tab
   - Paste the OAuth client JSON
   - Click "Authorize" - opens browser to login with your Google account
   - Grant permissions
   - Done! ✅

**Benefits**: 
- Full read/write access
- Use your own Google account
- Access private sheets you own
- No service account setup

---

### Option 3: Service Account (Advanced/Production)

For automated workflows that run without user interaction.

**When to use**: 
- Scheduled workflows that run automatically
- Multiple team members need access
- Production environments

**Setup**: See main guide [GOOGLE_SHEETS_WORKFLOW_GUIDE.md](./GOOGLE_SHEETS_WORKFLOW_GUIDE.md)

---

## Quick Start Examples

### Example 1: Read Public Sheet (No Auth)
```javascript
{
  "operation": "read",
  "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "sheetName": "Sheet1",
  "range": "A:D"
}
// No credentials needed!
```

### Example 2: Read/Write with OAuth2
```javascript
// 1. Add OAuth client credentials
// 2. Authorize once
// 3. Then use normally:
{
  "operation": "appendToNewTab",
  "spreadsheetId": "YOUR_SHEET_ID",
  "sheetName": "Data",
  "outputTabName": "Processed"
}
```

---

## Comparison Table

| Method | Setup Time | Read Access | Write Access | Best For |
|--------|------------|-------------|--------------|----------|
| **API Key** | 30 seconds | ✅ Public sheets only | ❌ No | Quick testing |
| **OAuth2** | 3 minutes | ✅ Your sheets | ✅ Full | Personal use |
| **Service Account** | 10 minutes | ✅ Shared sheets | ✅ Full | Production |

---

## Troubleshooting

### "Permission denied" error
- **With API Key**: Make sure sheet is shared as "Anyone with link can view"
- **With OAuth2**: Re-authorize and ensure you're logged into the correct Google account

### "Invalid credentials" error
- Check that you pasted the complete OAuth client JSON
- Make sure you clicked "Authorize" after pasting credentials

### Can't write to sheet
- API Key method only allows reading - use OAuth2 or Service Account for writing
- With OAuth2: Ensure you granted "edit" permissions during authorization

---

## Need Help?

- For public/test sheets → Use API Key (no setup!)
- For personal sheets → Use OAuth2 (3 min setup)
- For production → Use Service Account (full guide)

**Pro Tip**: Start with API Key for testing, then upgrade to OAuth2 when you need write access!
