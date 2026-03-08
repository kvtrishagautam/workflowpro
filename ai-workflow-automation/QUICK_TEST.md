# 🚀 Quick Test - Read a Public Google Sheet (No Setup!)

## Test in 2 Minutes

### 1. Use This Sample Public Sheet

We've prepared a test sheet for you:
- **Sheet ID**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
- **Contents**: Sample employee data
- **Public**: Anyone can view

Or use your own sheet and make it public:
1. Open your Google Sheet
2. Click "Share" → "Anyone with the link can view"  
3. Copy the Sheet ID from the URL

### 2. Create Workflow

1. Open `http://localhost:3000/editor`

2. **Add Google Sheets Node**:
   - Drag "Google Sheets" from node palette
   - Click to configure:

3. **Settings Tab**:
   ```
   Operation: Read Rows
   Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   Sheet Name: Class Data
   Range: A:E
   Include Headers: ✓ (checked)
   ```

4. **Credentials Tab**:
   ```
   Service Account JSON: [LEAVE EMPTY]
   ```
   ✨ **That's it! No credentials needed for public sheets!**

5. **Click "Run"** button

6. **Check Results**:
   - Open browser console (F12)
   - You should see the sheet data logged
   - Status: "success"
   - Data with rows from the sheet

---

## What Just Happened?

✅ Read data from Google Sheets  
✅ No Google Cloud Console setup  
✅ No service account  
✅ No authentication  
✅ Works instantly!  

---

## Next Steps

### Want to Write Data?

Use one of these methods:

#### Option A: Make Your Own Sheet (Personal Use)
1. Create/open your Google Sheet
2. In WorkflowPro, change operation to "Append" or "Append to New Tab"
3. Add credentials:
   - Simple: Use OAuth2 (see [SIMPLE_GOOGLE_SHEETS_SETUP.md](./SIMPLE_GOOGLE_SHEETS_SETUP.md))
   - Advanced: Use Service Account (see [GOOGLE_SHEETS_WORKFLOW_GUIDE.md](./GOOGLE_SHEETS_WORKFLOW_GUIDE.md))

#### Option B: Test Read-Only Workflows
- Use public sheets for testing schedules
- Build data transformation pipelines
- Export to other formats
- No write permissions needed!

---

## Example Workflows

### Read & Filter
```
Google Sheets (Read) → Filter Node → Display/Export
```

### Read & Transform  
```
Google Sheets (Read) → Set Node → Filter Node → HTTP (Send to API)
```

### Scheduled Reports
```
Schedule Node → Google Sheets (Read) → Email Node
```

---

## Troubleshooting

### "Permission denied" error
- Make sure the sheet is shared as "Anyone with the link can view"
- Check that the Sheet ID is correct (from the URL)

### "Spreadsheet not found
" error
- Verify the Spreadsheet ID is complete
- Ensure the sheet name matches exactly (case-sensitive)

### Want to write data?
- Public sheets are read-only
- See [SIMPLE_GOOGLE_SHEETS_SETUP.md](./SIMPLE_GOOGLE_SHEETS_SETUP.md) for write access options

---

**🎉 Congratulations!** You just read from Google Sheets with ZERO setup!

For more advanced features, check:
- [SIMPLE_GOOGLE_SHEETS_SETUP.md](./SIMPLE_GOOGLE_SHEETS_SETUP.md) - Easy authentication options
- [GOOGLE_SHEETS_WORKFLOW_GUIDE.md](./GOOGLE_SHEETS_WORKFLOW_GUIDE.md) - Full production guide
