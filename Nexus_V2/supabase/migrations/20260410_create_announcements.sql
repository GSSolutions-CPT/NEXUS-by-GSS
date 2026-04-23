-- ================================================================
-- Migration: Create announcements table
--
-- Used by:
--   - Admin: /admin/announcements (CRUD)
--   - Owner: /owner dashboard notice board (read-only)
--
-- Schema derived from actual code usage:
--   - supabase.from("announcements").select("*, profiles(first_name, last_name)")
--   - insert({ title, content, type, author_id })
--   - update({ title, content, type })
--   - delete().eq("id", id)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'emergency')),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Foreign key relationship for PostgREST join:
-- profiles(first_name, last_name) is joined via author_id → profiles.id
-- Since profiles.id references auth.users.id, we need an explicit FK
-- for PostgREST to resolve the join path.
ALTER TABLE public.announcements
    ADD CONSTRAINT announcements_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Remove the auth.users FK since we're pointing at profiles instead
ALTER TABLE public.announcements
    DROP CONSTRAINT IF EXISTS announcements_author_id_fkey1;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);

-- RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read announcements (owners see notice board)
CREATE POLICY "announcements_select"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

-- Only SuperAdmins can create announcements
CREATE POLICY "announcements_insert"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);

-- Only SuperAdmins can update announcements
CREATE POLICY "announcements_update"
ON public.announcements FOR UPDATE
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);

-- Only SuperAdmins can delete announcements
CREATE POLICY "announcements_delete"
ON public.announcements FOR DELETE
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);
