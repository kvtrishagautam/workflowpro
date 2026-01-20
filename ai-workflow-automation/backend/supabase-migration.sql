-- Run this SQL in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query

-- Create scheduled_email_jobs table
CREATE TABLE IF NOT EXISTS scheduled_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipients JSONB NOT NULL,
  recipient_group_id UUID,
  scheduled_date_time TIMESTAMPTZ,
  cron_expression TEXT,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('one-time', 'recurring')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
  personalization_csv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Create recipient_groups table
CREATE TABLE IF NOT EXISTS recipient_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  emails JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create delivery_logs table
CREATE TABLE IF NOT EXISTS delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_email_jobs(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  message_id TEXT,
  error TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON scheduled_email_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_schedule_type ON scheduled_email_jobs(schedule_type);
CREATE INDEX IF NOT EXISTS idx_logs_job_id ON delivery_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON delivery_logs(timestamp DESC);

-- Enable Row Level Security (optional, for multi-tenant support)
ALTER TABLE scheduled_email_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - customize based on your auth needs)
CREATE POLICY "Enable all access for scheduled_email_jobs" ON scheduled_email_jobs FOR ALL USING (true);
CREATE POLICY "Enable all access for recipient_groups" ON recipient_groups FOR ALL USING (true);
CREATE POLICY "Enable all access for delivery_logs" ON delivery_logs FOR ALL USING (true);
