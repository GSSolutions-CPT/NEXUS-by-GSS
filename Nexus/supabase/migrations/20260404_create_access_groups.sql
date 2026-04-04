-- Migration: Create access_groups table
CREATE TABLE IF NOT EXISTS public.access_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    access_pattern_name TEXT,
    area_name TEXT,
    start_time TEXT,
    duration TEXT,
    mon BOOLEAN,
    tue BOOLEAN,
    wed BOOLEAN,
    thu BOOLEAN,
    fri BOOLEAN,
    sat BOOLEAN,
    sun BOOLEAN,
    hol BOOLEAN,
    max_capacity TEXT
);

-- RLS
ALTER TABLE public.access_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read access groups"
ON public.access_groups FOR SELECT
TO authenticated
USING (true);
