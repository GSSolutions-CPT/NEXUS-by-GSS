-- ============================================================
-- Fix 1: Remove SECURITY DEFINER from RLS helper functions
-- ============================================================
-- These functions were running with superuser privileges, which
-- bypasses RLS entirely. Recreate as SECURITY INVOKER (default).

DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.user_unit_id();

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = (select auth.uid());
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.user_unit_id() RETURNS uuid AS $$
  SELECT unit_id FROM public.profiles WHERE id = (select auth.uid());
$$ LANGUAGE sql STABLE;

-- ============================================================
-- Fix RLS policies to use (select auth.uid()) and (select auth.user_role())
-- to prevent per-row re-evaluation
-- ============================================================

-- Drop existing visitors policies
DROP POLICY IF EXISTS "SuperAdmins see all visitors" ON visitors;
DROP POLICY IF EXISTS "GroupAdmins manage own visitors" ON visitors;
DROP POLICY IF EXISTS "Guards see parking visitors today" ON visitors;

-- Recreate with optimized subselects
CREATE POLICY "SuperAdmins see all visitors" ON visitors FOR ALL TO authenticated
    USING ((select auth.user_role()) = 'SuperAdmin');

CREATE POLICY "GroupAdmins manage own visitors" ON visitors FOR ALL TO authenticated
    USING (
        unit_id = (select auth.user_unit_id())
        AND (select auth.user_role()) = 'GroupAdmin'
    );

CREATE POLICY "Guards see parking visitors today" ON visitors FOR SELECT TO authenticated
    USING (
        needs_parking = TRUE
        AND start_time <= NOW()
        AND expiry_time >= NOW()
        AND (select auth.user_role()) = 'Guard'
    );

-- Fix profiles policy too
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated
    USING (id = (select auth.uid()));
