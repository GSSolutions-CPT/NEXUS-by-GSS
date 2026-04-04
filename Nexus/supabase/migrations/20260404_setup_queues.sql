-- Migration: Setup Queues (pgmq) and Webhooks (pg_net)
-- Run this in your Supabase SQL Editor

-- 1. Enable Required Extensions (if not already done via Dashboard)
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_cron CASCADE;

-- 2. Create the Queue
-- This handles creating the internal tables required for the queue.
SELECT pgmq.create('hardware_commands');

-- 3. Create a processor function
-- This function pulls the oldest messages from the queue and sends them to your C# Bridge
CREATE OR REPLACE FUNCTION process_hardware_queue()
RETURNS void AS $$
DECLARE
    msg RECORD;
    req_id BIGINT;
BEGIN
    -- Pop Top 10 messages from the hardware_commands queue
    -- This locks and deletes them from the queue
    FOR msg IN SELECT * FROM pgmq.pop('hardware_commands', 10) LOOP
        
        -- Send via pg_net to the C# Bridge
        -- IMPORTANT: Replace the URL with your actual Ngrok or public IP of the Gatehouse PC
        SELECT net.http_post(
            url := 'https://REPLACE_WITH_YOUR_NGROK_URL.ngrok-free.app/api/command',
            body := msg.message::jsonb,
            headers := '{"Content-Type": "application/json"}'::jsonb
        ) INTO req_id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Schedule the cron job to run every minute
-- (Supabase pg_cron minimum resolution is 1 minute without custom extensions)
-- Uncomment this once your Ngrok URL is in place!

-- SELECT cron.schedule(
--   'process_hardware_queue_job',
--   '* * * * *',
--   $$ SELECT process_hardware_queue(); $$
-- );
