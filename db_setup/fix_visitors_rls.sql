-- ============================================================
-- Fix RLS policies for 'visitors' table
-- Resolves: auth_rls_initplan + multiple_permissive_policies
-- ============================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own unit visitors" ON visitors;
DROP POLICY IF EXISTS "Users can create visitors for own unit" ON visitors;
DROP POLICY IF EXISTS "Users can update own unit visitors" ON visitors;
DROP POLICY IF EXISTS "SuperAdmins full access to visitors" ON visitors;
DROP POLICY IF EXISTS "Public can view individual visitor pass" ON visitors;

-- ── SELECT ──────────────────────────────────────────────────
-- Anon users can view passes (for /guest/[id] page)
CREATE POLICY "anon_select_visitors"
    ON visitors FOR SELECT
    TO anon
    USING (true);

-- Authenticated users: see own unit visitors OR if SuperAdmin see all
CREATE POLICY "authenticated_select_visitors"
    ON visitors FOR SELECT
    TO authenticated
    USING (
        unit_id IN (
            SELECT unit_id FROM profiles WHERE id = (select auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SuperAdmin'
        )
    );

-- ── INSERT ──────────────────────────────────────────────────
-- Authenticated users: insert for own unit OR if SuperAdmin
CREATE POLICY "authenticated_insert_visitors"
    ON visitors FOR INSERT
    TO authenticated
    WITH CHECK (
        unit_id IN (
            SELECT unit_id FROM profiles WHERE id = (select auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SuperAdmin'
        )
    );

-- ── UPDATE ──────────────────────────────────────────────────
-- Authenticated users: update own unit visitors OR if SuperAdmin
CREATE POLICY "authenticated_update_visitors"
    ON visitors FOR UPDATE
    TO authenticated
    USING (
        unit_id IN (
            SELECT unit_id FROM profiles WHERE id = (select auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SuperAdmin'
        )
    );

-- ── DELETE ──────────────────────────────────────────────────
-- Only SuperAdmins can hard-delete (normal flow uses status='Revoked')
CREATE POLICY "superadmin_delete_visitors"
    ON visitors FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'SuperAdmin'
        )
    );
