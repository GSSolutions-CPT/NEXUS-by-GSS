-- POPI Act Compliance Migration: Data Minimality & Retention

-- 1. Minimality: Drop unused or excessive personal information fields
ALTER TABLE public.visitors DROP COLUMN IF EXISTS email;

-- 2. Retention: Automate de-identification of visitors whose passes expired > 30 days ago.
-- Requires pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run daily at midnight
-- It scrubs first_name, last_name, and phone for visitors older than 30 days.
-- We do not hard-delete the row, to ensure audit_logs can still trace the UUID to a redacted identity.
SELECT cron.schedule(
    'popi-retention-scrub',
    '0 0 * * *',
    $$
    UPDATE public.visitors
    SET 
        first_name = '[REDACTED]',
        last_name = '[REDACTED]',
        phone = NULL,
        status = 'Revoked'
    WHERE 
        expiry_time < NOW() - INTERVAL '30 days'
        AND first_name != '[REDACTED]';
    $$
);
