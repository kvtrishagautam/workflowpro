# 📊 Google Looker Studio Dashboard Setup Guide

Complete guide to creating professional task management visualizations using Google Looker Studio with your Google Sheets data.

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Open Looker Studio

1. Go to **[https://lookerstudio.google.com](https://lookerstudio.google.com)**
2. Sign in with your Google account
3. Click **"Create"** → **"Report"**

### Step 2: Connect Your Google Sheet

1. In the data source selector, choose **"Google Sheets"**
2. **Authorize** Looker Studio to access your Google Drive
3. **Select your spreadsheet** (the one with task data)
4. Choose the **sheet tab** (e.g., "Sheet1" or "Tasks")
5. Click **"Add"**

### Step 3: Start Building

You'll see a blank canvas with your data connected. Now let's add visualizations!

---

## 📈 Building Your Dashboard

### Layout Structure

Create a professional dashboard with these sections:

```
┌─────────────────────────────────────────────────┐
│  📊 Task Management Dashboard                   │
│  Last Updated: [Date Field]                     │
├──────────────┬──────────────┬──────────────────┤
│ Total Tasks  │ Completed    │ In Progress      │
│     20       │      8       │       7          │
├──────────────┴──────────────┴──────────────────┤
│ Status Pie Chart      │ Priority Donut Chart   │
│                       │                         │
├───────────────────────┼─────────────────────────┤
│ Workload by Owner     │ Completion by Project   │
│ (Bar Chart)           │ (Bar Chart)             │
├───────────────────────┴─────────────────────────┤
│ Critical & Overdue Tasks Table                  │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Visualization Guide

### 1️⃣ Key Metrics (Scorecards)

**Total Tasks**
- Chart type: **Scorecard**
- Metric: `Record Count`
- Style: Large number, gradient background

**Completed Tasks**
- Chart type: **Scorecard with Compact Number**
- Metric: `Record Count`
- Filter: `Status` = "Completed"
- Color: Green (#28a745)

**In Progress Tasks**
- Chart type: **Scorecard**
- Metric: `Record Count`
- Filter: `Status` = "In Progress"
- Color: Orange (#fd7e14)

**Average Completion %**
- Chart type: **Scorecard**
- Metric: `AVG(Completion %)`
- Format: Percentage

---

### 2️⃣ Status Breakdown (Pie Chart)

**Setup:**
1. Insert → **Pie Chart**
2. **Dimension**: `Status`
3. **Metric**: `Record Count`
4. **Slice colors**:
   - Completed: #28a745 (green)
   - In Progress: #ffc107 (yellow)
   - Blocked: #dc3545 (red)
   - Not Started: #6c757d (gray)

**Style Tips:**
- Enable data labels with percentages
- Add donut hole for modern look
- Show legend on right side

---

### 3️⃣ Priority Distribution (Donut Chart)

**Setup:**
1. Insert → **Donut Chart**
2. **Dimension**: `Priority`
3. **Metric**: `Record Count`
4. **Slice colors**:
   - Critical: #dc3545 (red)
   - High: #fd7e14 (orange)
   - Medium: #ffc107 (yellow)
   - Low: #28a745 (green)

---

### 4️⃣ Workload by Owner (Bar Chart)

**Setup:**
1. Insert → **Bar Chart**
2. **Dimension**: `Owner`
3. **Metric**: `Record Count`
4. **Sort**: Descending by count
5. **Color**: Single color (#667eea)

**Optional Enhancement:**
- Add second metric: `AVG(Completion %)`
- Enable stacking for status breakdown per owner

---

### 5️⃣ Completion by Project (Column Chart)

**Setup:**
1. Insert → **Column Chart**
2. **Dimension**: `Project Name`
3. **Metric**: `AVG(Completion %)`
4. **Sort**: Descending
5. **Y-axis**: 0-100% range
6. **Color**: Gradient based on value

**Add Reference Line:**
- Type: Constant
- Value: 50 (target completion)
- Color: Red dashed line

---

### 6️⃣ Timeline View (Time Series)

**Setup:**
1. Insert → **Time Series Chart**
2. **Dimension**: `Due Date`
3. **Metric**: `Record Count`
4. **Breakdown**: `Status`

**Shows:** Task completion trends over time

---

### 7️⃣ Critical & Overdue Tasks (Table)

**Setup:**
1. Insert → **Table**
2. **Dimensions**:
   - Task Name
   - Owner
   - Priority
   - Status
   - Due Date
   - Completion %
3. **Filters**:
   - Priority = "Critical" OR
   - Status = "Blocked" OR
   - Due Date < TODAY
4. **Sort**: Due Date ascending

**Conditional Formatting:**
- Priority = "Critical" → Red row
- Due Date < TODAY → Orange highlight
- Completion % < 50 → Yellow background

---

### 8️⃣ Department Performance (Pivot Table)

**Setup:**
1. Insert → **Pivot Table**
2. **Row**: `Department`
3. **Column**: `Status`
4. **Metric**: `Record Count`
5. **Show totals**: Row and column

**Shows:** Task distribution across departments and statuses

---

## 🎨 Design & Styling

### Color Palette

Use consistent colors throughout:

```css
Primary: #667eea (Purple Blue)
Secondary: #764ba2 (Purple)

Status Colors:
- Completed: #28a745 (Green)
- In Progress: #ffc107 (Yellow)
- Blocked: #dc3545 (Red)
- Not Started: #6c757d (Gray)

Priority Colors:
- Critical: #dc3545 (Red)
- High: #fd7e14 (Orange)
- Medium: #ffc107 (Yellow)
- Low: #28a745 (Green)
```

### Typography

1. **Title**: 24pt, Bold, Dark Gray
2. **Section Headers**: 18pt, Semibold, Purple
3. **Chart Titles**: 14pt, Regular, Dark Gray
4. **Data Labels**: 11pt, Regular, Gray

### Layout Tips

- Use **grid layout** for alignment
- Add **white space** between sections
- Group related visualizations
- Use **containers** for visual separation

---

## 🔄 Advanced Features

### 1. Date Range Control

Add a **date range selector** to filter all charts:

1. Insert → **Date Range Control**
2. Position at top of dashboard
3. Set default: Last 30 days
4. All charts will auto-filter

### 2. Interactive Filters

Add dropdown filters for:
- **Project Name** filter
- **Department** filter
- **Owner** filter
- **Priority** filter

Users can click to filter entire dashboard!

### 3. Calculated Fields

Create custom metrics:

**Overdue Tasks:**
```
CASE
  WHEN Due Date < CURRENT_DATE() AND Status != "Completed" 
  THEN 1
  ELSE 0
END
```

**Days Until Due:**
```
DATE_DIFF(Due Date, CURRENT_DATE())
```

**Completion Status:**
```
CASE
  WHEN Completion % >= 100 THEN "Complete"
  WHEN Completion % >= 50 THEN "On Track"
  WHEN Completion % >= 25 THEN "At Risk"
  ELSE "Critical"
END
```

---

## 📱 Mobile Optimization

1. Click **View** → **Mobile Layout**
2. Rearrange visualizations for mobile
3. Stack charts vertically
4. Reduce font sizes
5. Hide less important data on mobile

---

## 🔗 Sharing & Collaboration

### Share Dashboard

1. Click **"Share"** (top right)
2. Options:
   - **View Access**: Anyone with link can view
   - **Edit Access**: Specific users can edit
   - **Email**: Send directly to team

### Embed in Website

1. Click **File** → **Embed Report**
2. Copy embed code
3. Paste into your website HTML

### Schedule Email Reports

1. Click **File** → **Schedule Email Delivery**
2. Set frequency (Daily, Weekly, Monthly)
3. Add recipients
4. Choose PDF or link

---

## 🎯 Pre-Built Template

### Dashboard Checklist

Create your dashboard with these components:

**Top Section - KPIs**
- ☐ Total Tasks scorecard
- ☐ Completed Tasks scorecard
- ☐ In Progress scorecard
- ☐ Average Completion % scorecard

**Main Section - Charts**
- ☐ Status Breakdown (Pie)
- ☐ Priority Distribution (Donut)
- ☐ Workload by Owner (Bar)
- ☐ Completion by Project (Column)

**Detail Section**
- ☐ Critical/Overdue Tasks table
- ☐ Timeline chart
- ☐ Department pivot table

**Controls**
- ☐ Date range selector
- ☐ Project filter
- ☐ Department filter
- ☐ Owner filter

---

## 🔧 Troubleshooting

### Data Not Showing

- ✅ Check Google Sheet is shared with your account
- ✅ Verify sheet tab name is correct
- ✅ Refresh data source: **Resource** → **Manage Added Data Sources** → **Refresh**

### Charts Not Updating

- Click **Refresh Data** icon (circular arrow)
- Or set auto-refresh: **File** → **Data Credentials** → **Set refresh schedule**

### Performance Issues

- Limit data to last 6-12 months
- Use **Extract Connection** for large datasets
- Reduce number of charts per page

---

## 🚀 Next Steps

1. **Build your dashboard** following this guide
2. **Share** with your team for feedback
3. **Iterate** based on usage
4. **Automate** with scheduled email reports
5. **Integrate** with other data sources (if needed)

---

## 💡 Pro Tips

1. **Start simple**: Add 3-4 key charts first
2. **User test**: Show to stakeholders early
3. **Mobile first**: Design for smallest screen
4. **Keep updating**: Dashboards evolve with needs
5. **Document**: Add text boxes explaining metrics

---

## 📚 Resources

- **Looker Studio Help**: https://support.google.com/looker-studio
- **Community Gallery**: Browse templates for inspiration
- **Video Tutorials**: Search "Looker Studio tutorial" on YouTube
- **Formula Reference**: https://support.google.com/looker-studio/table/6379764

---

## ✨ Your Dashboard is Ready!

Once complete, you'll have:
- ✅ Real-time data from Google Sheets
- ✅ Professional visualizations
- ✅ Interactive filters
- ✅ Mobile-friendly design
- ✅ Shareable link for team

**Estimated Build Time**: 30-60 minutes

**Access Your Dashboard**: https://lookerstudio.google.com/reporting/[your-report-id]

Enjoy your new Task Management Dashboard! 📊
