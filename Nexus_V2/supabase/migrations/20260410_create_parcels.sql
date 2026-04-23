-- ================================================================
-- Migration: Create parcels table
--
-- Used by:
--   - Guard: log incoming deliveries (POST /api/parcels)
--   - Guard: release parcels to tenants (POST /api/parcels/[id]/collect)
--   - Owner: view parcels for their unit (GET /api/parcels)
--   - Admin: view all parcels (GET /api/parcels)
--
-- Schema derived from actual code usage:
--   - insert({ unit_id, courier_name, recipient_name, status, logged_by })
--   - update({ status, collected_at, collection_signature_uid })
--   - select("*, units(name), 
--            logged_by_profile:profiles!parcels_logged_by_fkey(...),
--            collected_by_profile:profiles!parcels_collection_signature_uid_fkey(...)")
-- ================================================================

CREATE TABLE IF NOT EXISTS public.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    courier_name TEXT NOT NULL,
    recipient_name TEXT,
    status TEXT NOT NULL DEFAULT 'Pending Collection' CHECK (status IN ('Pending Collection', 'Collected')),
    logged_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    collected_at TIMESTAMPTZ,
    collection_signature_uid UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Named FKs for PostgREST join aliases (parcels_logged_by_fkey, parcels_collection_signature_uid_fkey)
-- The column-level REFERENCES above create auto-named constraints.
-- We need to rename them for the API code's explicit join aliases to work.

-- Drop auto-generated constraints and recreate with explicit names
ALTER TABLE public.parcels
    DROP CONSTRAINT IF EXISTS parcels_logged_by_fkey;
ALTER TABLE public.parcels
    ADD CONSTRAINT parcels_logged_by_fkey
    FOREIGN KEY (logged_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.parcels
    DROP CONSTRAINT IF EXISTS parcels_collection_signature_uid_fkey;
ALTER TABLE public.parcels
    ADD CONSTRAINT parcels_collection_signature_uid_fkey
    FOREIGN KEY (collection_signature_uid) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcels_unit_id ON public.parcels(unit_id);
CREATE INDEX IF NOT EXISTS idx_parcels_logged_by ON public.parcels(logged_by);
CREATE INDEX IF NOT EXISTS idx_parcels_logged_at ON public.parcels(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);

-- RLS
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- SuperAdmins + Guards can see all parcels
CREATE POLICY "parcels_select_admin_guard"
ON public.parcels FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') IN ('SuperAdmin', 'Guard')
);

-- GroupAdmins (owners) can see only their own unit's parcels
CREATE POLICY "parcels_select_owner"
ON public.parcels FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'GroupAdmin'
    AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
);

-- Only Guards and SuperAdmins can log new parcels
CREATE POLICY "parcels_insert"
ON public.parcels FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('SuperAdmin', 'Guard')
);

-- Only Guards and SuperAdmins can update parcels (mark as collected)
CREATE POLICY "parcels_update"
ON public.parcels FOR UPDATE
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') IN ('SuperAdmin', 'Guard')
);
