-- ================================================================
-- Migration: Add RPC for Worker Polling with SKIP LOCKED
-- 
-- Fixes race conditions when multiple C# background workers are
-- running simultaneously by safely allocating unique pending
-- visitors to each worker using SELECT FOR UPDATE SKIP LOCKED.
-- ================================================================

-- Step 1: Broaden the status check constraint on the visitors table
-- First we need to drop the old constraint if it exists. Postgres doesn't
-- have a clean REPLACE CONSTRAINT, so we try to drop the common names.
-- Note: Assuming the constraint might be named visitors_status_check.

DO $$
BEGIN
  BEGIN
    ALTER TABLE public.visitors DROP CONSTRAINT IF EXISTS visitors_status_check;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Add a new constraint that allows 'Syncing'
ALTER TABLE public.visitors 
  ADD CONSTRAINT visitors_status_check 
  CHECK (status IN ('Pending', 'Syncing', 'Active', 'Revoked', 'Expired'));

-- Step 2: Create the RPC
CREATE OR REPLACE FUNCTION public.get_pending_visitors_for_sync(limit_count INT DEFAULT 50)
RETURNS SETOF public.visitors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH locked_visitors AS (
        SELECT id
        FROM public.visitors
        WHERE status = 'Pending'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT limit_count
    )
    UPDATE public.visitors v
    SET status = 'Syncing' -- Mark them so other workers ignore them
    FROM locked_visitors lv
    WHERE v.id = lv.id
    RETURNING v.*;
END;
$$;
