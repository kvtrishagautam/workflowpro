# Google Sheets Workflow Automation - Quick Start Guide

## Overview

This guide will help you set up a scheduled workflow that:
1. **Reads** data from a Google Sheet on a schedule
2. **Cleans and filters** the data using Set and Filter nodes
3. **Writes** the processed data to a new tab (or different sheet)
4. **Formats** output for visualization tools (Looker Studio, Power BI, Tableau)

## Prerequisites

### 1. Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter a name (e.g., "workflowpro-sheets")
4. Grant role: "Editor" (or custom role with Sheets access)
5. Click "Done"

### 3. Download Service Account Key

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - this downloads a JSON file
6. **Keep this file secure!**

### 4. Share Google Sheet

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON file, looks like: `workflowpro-sheets@project-id.iam.gserviceaccount.com`)
4. Give it "Editor" permission
5. Click "Send"

## Workflow Setup

### Step 1: Start the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Frontend should open at `http://localhost:3000`

### Step 2: Create Your Workflow

1. Go to the **Editor** page
2. Add nodes in this order:

#### A. Schedule Trigger Node
- Drag "Schedule" node from palette
- Click to configure:
  - **Trigger Mode**: Interval or Cron
  - **Interval**: Every 5 minutes (or your preference)
  - **Timezone**: Your timezone

#### B. Google Sheets Read Node
- Drag "Google Sheets" node
- Click to configure:
  - **Settings Tab**:
    - Operation: `Read Rows`
    - Spreadsheet ID: Copy from your sheet URL (the long string between `/d/` and `/edit`)
    - Sheet Name: `Sheet1` (or your sheet name)
    - Range: `A:F` (adjust as needed)
    - Include Headers: ✓ (checked)
  
  - **Credentials Tab**:
    - Paste entire service account JSON file content

#### C. Set Node (Optional - for data cleaning)
- Drag "Set" node
- Configure fields to add/modify:
  - Example: Add a `processed_at` timestamp field
  - Example: Format date fields
  - Example: Calculate totals

#### D. Filter Node (Optional - for filtering)
- Drag "Filter" node
- Add conditions:
  - Example: `status` equals `active`
  - Example: `amount` greater than `100`

#### E. Google Sheets Write Node
- Drag another "Google Sheets" node
- Click to configure:
  - **Settings Tab**:
    - Operation: `Append to New Tab`
    - Spreadsheet ID: Same as read (or different)
    - Output Tab Name: `ProcessedData`
    - Include Headers: ✓
    - Format for Visualization Tools: ✓
  
  - **Credentials Tab**:
    - Paste service account JSON again

### Step 3: Connect the Nodes

- Click and drag from the output handle (right side) of one node to the input handle (left side) of the next
- Final flow:
  ```
  Schedule → Read Sheets → Set → Filter → Write Sheets
  ```

### Step 4: Test the Workflow

1. Click **"Run"** button to test immediately
2. Check browser console for execution logs
3. Verify your Google Sheet has a new tab with processed data

### Step 5: Save and Schedule

1. Click **"Save"** button
2. The workflow will now run on your schedule automatically!

## Configuration Options

### Making the Workflow Modular

**To disable data transformation:**
- Simply delete or disconnect the Set and Filter nodes
- Connect Read directly to Write node

**To change schedule:**
- Click on Schedule node
- Modify interval or cron expression
- Save workflow

**To switch input/output sheets:**
- Click on Google Sheets nodes
- Update Spreadsheet ID and Sheet Name
- Save workflow

## Output for Visualization Tools

When "Format for Visualization Tools" is enabled:

✓ **Headers preserved** as first row  
✓ **Data types maintained** (numbers stay as numbers, not text)  
✓ **Dates formatted** as ISO strings  
✓ **Compatible with:** Looker Studio, Power BI, Tableau  

### Connecting to Looker Studio

1. Open [Looker Studio](https://lookerstudio.google.com/)
2. Create new report
3. Add data source → Google Sheets
4. Select your spreadsheet → Choose "Processed Data" tab
5. Headers automatically detected as dimensions
6. Create charts - data updates automatically!

## Troubleshooting

### "Authentication failed" error
- Check service account JSON is correctly pasted
- Verify you shared the sheet with the service account email
- Ensure Google Sheets API is enabled

### "Spreadsheet not found" error
- Verify Spreadsheet ID is correct
- Check the sheet is shared with service account email
- Service account email needs Editor permission

### No data appears
- Check the range includes data rows
- Verify sheet name is correct (case-sensitive)
- Check browser console for detailed error messages

### Schedule not triggering
- Verify backend server is running
- Check MongoDB connection is active
- Look at backend console for job scheduler logs

## Example Use Cases

### 1. Sales Data Processing
```
Schedule (Daily 9 AM) →
Read (Sales_Raw) →
Set (Calculate totals, format currency) →
Filter (Amount > $1000) →
Write (Sales_Processed)
```

### 2. Inventory Management
```
Schedule (Every hour) →
Read (Inventory_Feed) →
Filter (Quantity < 10) →
Write (Low_Stock_Alert)
```

### 3. Customer Analytics
```
Schedule (Weekly) →
Read (Customer_Data) →
Set (Calculate LTV, segment) →
Filter (Active last 30 days) →
Write (Active_Customers)
```

## Advanced Configuration

### Using Different Output Spreadsheet

Set operation to `Write to Different Sheet` and provide a different Spreadsheet ID.

### Scheduling with Cron Expressions

Common patterns:
- `0 */5 * * *` - Every 5 minutes
- `0 9 * * *` - Daily at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM
- `0 0 1 * *` - First day of every month

## Need Help?

Check the [main documentation](../README.md) or open an issue on GitHub.
