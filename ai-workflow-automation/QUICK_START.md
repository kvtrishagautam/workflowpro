# ✅ Setup Complete - Quick Start Guide

## What's Ready

✅ **Supabase Database** - Connected and configured  
✅ **SMTP Email** - Gmail configured (ayshhha234@gmail.com)  
✅ **Scheduled Email Node** - Backend implemented  
✅ **Frontend UI** - Node available in palette  

---

## Final Steps (2 minutes)

### 1. Run SQL Migration in Supabase

1. Open [Supabase Dashboard](https://app.supabase.com/project/ahkrhghvpambgyslkmkq)
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Copy from supabase-migration.sql file
-- Or run this quick version:

CREATE TABLE IF NOT EXISTS scheduled_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipients JSONB NOT NULL,
  recipient_group_id UUID,
  scheduled_date_time TIMESTAMPTZ,
  cron_expression TEXT,
  schedule_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  personalization_csv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS recipient_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  emails JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_email_jobs(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  message_id TEXT,
  error TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

5. Click **Run** (or Ctrl+Enter)

### 2. Restart Backend

```bash
# Stop current backend (Ctrl+C if running)
cd backend
npm run dev
```

**Expected output:**
```
✅ Database and scheduler initialized
Registered node type: SCHEDULED_EMAIL
🚀 Email Automation Backend running on http://localhost:5000
```

---

## Test It Works

### Quick API Test

```bash
curl http://localhost:5000/api/recipient-groups
```

Should return: `{"groups":[]}`

### Create Your First Scheduled Email

1. Open frontend: http://localhost:3000/editor
2. Drag **"Scheduled Email"** node from palette (📅 icon)
3. Configure:
   - **Subject**: "Test Email"
   - **Body**: "Hello! This is a test."
   - **Schedule Type**: One-time
   - **Date & Time**: Select 2 minutes from now
   - **Recipients**: Your email address
4. Click **"Run Workflow"**
5. Wait 2 minutes - check your inbox!

---

## Configuration Summary

| Setting | Value |
|---------|-------|
| **Supabase URL** | https://ahkrhghvpambgyslkmkq.supabase.co |
| **Database** | PostgreSQL (Supabase) |
| **SMTP Provider** | Gmail |
| **Email From** | ayshhha234@gmail.com |
| **Backend Port** | 5000 |
| **Frontend Port** | 3000 |

---

## Troubleshooting

**Backend won't start?**
- Check if port 5000 is available
- Verify `.env` file exists in `backend/` directory

**Tables not created?**
- Make sure you ran the SQL migration in Supabase
- Check Supabase SQL Editor for errors

**Emails not sending?**
- Verify Gmail app password is correct (no spaces)
- Check delivery logs: `curl http://localhost:5000/api/delivery-logs`

---

## Next Steps

- ✅ Test one-time scheduled email
- ✅ Test recurring email (daily/weekly)
- ✅ Create recipient groups
- ✅ Try CSV personalization

See `walkthrough.md` for detailed usage examples!
