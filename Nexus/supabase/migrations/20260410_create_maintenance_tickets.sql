-- ================================================================
-- Migration: Create maintenance_tickets table
--
-- Used by:
--   - Owner: submit maintenance requests (POST /api/maintenance)
--   - Owner: view own unit's tickets (GET /api/maintenance)
--   - Admin: view all tickets (GET /api/maintenance)
--   - Admin: update ticket status (PATCH /api/maintenance/[id])
--   - Admin: delete tickets (DELETE /api/maintenance/[id])
--
-- Schema derived from actual code usage:
--   - insert({ title, description, priority, category, status, unit_id, reported_by, image_url })
--   - update({ status })
--   - select("*, units(name), profiles!maintenance_tickets_reported_by_fkey(first_name, last_name)")
-- ================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'Plumbing', 'Electrical', 'HVAC', 'Security', 'Appliance', 'Structural')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    image_url TEXT
);

-- Named FK for PostgREST join alias
ALTER TABLE public.maintenance_tickets
    DROP CONSTRAINT IF EXISTS maintenance_tickets_reported_by_fkey;
ALTER TABLE public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_reported_by_fkey
    FOREIGN KEY (reported_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_unit_id ON public.maintenance_tickets(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_reported_by ON public.maintenance_tickets(reported_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON public.maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_created_at ON public.maintenance_tickets(created_at DESC);

-- RLS
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;

-- SuperAdmins can see all tickets
CREATE POLICY "maintenance_select_admin"
ON public.maintenance_tickets FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);

-- GroupAdmins can see their own unit's tickets
CREATE POLICY "maintenance_select_owner"
ON public.maintenance_tickets FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'GroupAdmin'
    AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
);

-- GroupAdmins can create tickets for their own unit
CREATE POLICY "maintenance_insert"
ON public.maintenance_tickets FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('GroupAdmin', 'SuperAdmin')
    AND (
        (auth.jwt() ->> 'user_role') = 'SuperAdmin'
        OR unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
    )
);

-- Only SuperAdmins can update tickets (change status)
CREATE POLICY "maintenance_update"
ON public.maintenance_tickets FOR UPDATE
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);

-- Only SuperAdmins can delete tickets
CREATE POLICY "maintenance_delete"
ON public.maintenance_tickets FOR DELETE
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);
