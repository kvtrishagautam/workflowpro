# Google Sheets API - Zero Authentication Setup

## ✨ Use Google Sheets API Right Now (No Setup!)

### How It Works

For **public sheets**, the Google Sheets API v4 can be accessed without any authentication. Just make your sheet public and use the API directly.

---

## Quick Start (30 Seconds)

### 1. Make Your Sheet Public

1. Open your Google Sheet
2. Click **"Share"** button
3. Click **"Change to anyone with the link"**
4. Choose **"Viewer"** permission
5. Click **"Done"**

### 2. Get Your Sheet ID

From your sheet URL:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                          ↑____________________________________________↑
                                                    This is your Sheet ID
```

### 3. Use in WorkflowPro

In the workflow editor:

**Settings Tab:**
- **Operation**: Read Rows
- **Spreadsheet ID**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- **Sheet Name**: `Sheet1`
- **Range**: `A:E`

**Credentials Tab:**
- Leave completely **EMPTY** ✨

Click **"Run"** - Done!

---

## Test Sheet (Ready to Use)

Use this public test sheet to try immediately:

```
Sheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
Sheet Name: Class Data
Range: A:E
```

Contains sample student data - works instantly!

---

## What You Can Do

### ✅ Supported (Public Sheets)
- **Read data** - Full read access
- **Filter rows** - Use Filter node
- **Transform data** - Use Set node  
- **Schedule reading** - Read on a schedule
- **Export/Send** - Send to email, HTTP, etc.

### ❌ Not Supported (Public Sheets)
- Write data
- Append rows
- Create new tabs
- Delete data

**For write access**: See advanced guides, but reading works 100% without setup!

---

## Real-World Examples

### Example 1: Read Product Catalog
```javascript
// Public sheet with product data
{
  "operation": "read",
  "spreadsheetId": "YOUR_PUBLIC_SHEET_ID",
  "sheetName": "Products",
  "range": "A:F"
}
// No credentials needed!
```

### Example 2: Scheduled Report
```
Schedule Node (Daily 9 AM)
    ↓
Google Sheets (Read public sales data)
    ↓
Filter Node (This month only)
    ↓
Email Node (Send report)
```

### Example 3: Data Sync
```
Schedule Node (Every hour)
    ↓
Google Sheets (Read public inventory)
    ↓
HTTP Node (POST to your API)
```

---

## API Limits

Google Sheets API has these limits for public access:
- **100 requests per 100 seconds** per user
- **500 requests per 100 seconds** per project

For most workflows, this is plenty! If you need more, upgrade to authenticated access.

---

## Troubleshooting

### "Permission denied"
- **Fix**: Make sure sheet is shared as "Anyone with the link can **view**"
- Don't use "Restricted" - must be "Anyone with the link"

### "Spreadsheet not found"
- **Fix**: Check the Sheet ID is copied correctly
- Remove any extra characters or spaces

### "Range not found"
- **Fix**: Check sheet name is exact (case-sensitive)
- Sheet name must match exactly: "Sheet1" ≠ "sheet1"

### Want to write data?
- Public API access is **read-only**
- For write access, you need authentication
- See `SIMPLE_GOOGLE_SHEETS_SETUP.md` for easy options

---

## That's It!

🎉 **You're done!** No Google Cloud Console, no service accounts, no OAuth - just public sheets and the API.

**Test now:**
1. Open `http://localhost:3000/editor`
2. Add Google Sheets node  
3. Use test Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
4. Sheet Name: `Class Data`
5. Leave credentials empty
6. Click Run!

---

## When to Upgrade

Stick with public API if:
- ✅ Only need to READ data
- ✅ Sheet can be public
- ✅ Under 100 requests per 100 seconds

Upgrade to authenticated API if:
- ❌ Need to WRITE data
- ❌ Sheet must be private
- ❌ Need higher rate limits

For write access: See `SIMPLE_GOOGLE_SHEETS_SETUP.md`
