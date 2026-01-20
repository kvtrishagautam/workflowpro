# Supabase Setup Guide

## Quick Setup (3 Steps)

### Step 1: Run SQL Migration in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase-migration.sql`
6. Click **Run** (or press Ctrl+Enter)

You should see: "Success. No rows returned"

### Step 2: Update SMTP Credentials

Edit `backend/.env` file and add your email credentials:

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**For Gmail users**: 
- Go to Google Account → Security → 2-Step Verification → App passwords
- Generate an app password for "Mail"
- Use that password in SMTP_PASS

### Step 3: Restart Backend

```bash
# Stop current backend (Ctrl+C)
cd backend
npm run dev
```

You should see:
```
✅ Database and scheduler initialized
Registered node type: SCHEDULED_EMAIL
```

## That's it! 🎉

Your scheduled email system is now connected to Supabase and ready to use.

## Verify Setup

Test the API:
```bash
curl http://localhost:5000/api/recipient-groups
```

Should return: `{"groups":[]}`

## Next Steps

- Create a recipient group via API
- Add a scheduled email node in the frontend
- Schedule your first email!

See `walkthrough.md` for usage examples.
