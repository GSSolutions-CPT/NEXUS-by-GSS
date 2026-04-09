-- ================================================================
-- Migration: Fix missing RLS policies for Guards + Units
--
-- Issues fixed:
--   1. Guards lost visitor SELECT access after JWT migration
--      (20260310_jwt_custom_claims.sql dropped old policies but
--      didn't add a Guard-specific one)
--   2. Units table has RLS enabled but NO SELECT policy — all
--      queries from authenticated users return 0 rows
--   3. Tag requests still use N+1 subqueries against profiles
-- ================================================================

-- ──────────────────────────────────────────────
-- FIX 1: Guard access to visitors table
-- Guards need to see active visitors to verify entry passes
-- ──────────────────────────────────────────────

CREATE POLICY "visitors_select_guard"
ON public.visitors FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'Guard'
);
-- Guards are site-wide: they see ALL visitors (not scoped to a unit)
-- because they don't own a unit — they need to verify any visitor at the gate

-- ──────────────────────────────────────────────
-- FIX 2: Units table SELECT policy
-- All authenticated users need to read units —
-- Owners see their unit name, Admins see all, Guards see for parcels
-- ──────────────────────────────────────────────

CREATE POLICY "units_select_authenticated"
ON public.units FOR SELECT
TO authenticated
USING (true);

-- SuperAdmins can manage units (insert/update/delete)
CREATE POLICY "units_manage_admin"
ON public.units FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
)
WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);

-- ──────────────────────────────────────────────
-- FIX 3: Tag requests → Migrate to JWT-based RLS
-- Replace N+1 subqueries with zero-cost JWT reads
-- ──────────────────────────────────────────────

DROP POLICY IF EXISTS "GroupAdmins can create tag requests for their unit" ON public.tag_requests;
DROP POLICY IF EXISTS "GroupAdmins can view their unit's requests" ON public.tag_requests;
DROP POLICY IF EXISTS "SuperAdmins can manage all tag requests" ON public.tag_requests;

-- SuperAdmins see and manage everything
CREATE POLICY "tag_requests_all_admin"
ON public.tag_requests FOR ALL
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
)
WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
);

-- GroupAdmins can view their own unit's requests
CREATE POLICY "tag_requests_select_owner"
ON public.tag_requests FOR SELECT
TO authenticated
USING (
    (auth.jwt() ->> 'user_role') = 'GroupAdmin'
    AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
);

-- GroupAdmins can insert requests for their own unit
CREATE POLICY "tag_requests_insert_owner"
ON public.tag_requests FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'GroupAdmin'
    AND auth.uid() = requested_by
    AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
);
