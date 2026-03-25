-- ============================================================
-- Fix 1: Recreate RLS helper functions as SECURITY INVOKER
-- ============================================================
-- Previously used auth.user_role() with SECURITY DEFINER which
-- bypasses RLS. Moved to public schema with SECURITY INVOKER.

CREATE OR REPLACE FUNCTION public.user_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = (select auth.uid());
$$ LANGUAGE sql STABLE SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.user_unit_id() RETURNS uuid AS $$
  SELECT unit_id FROM public.profiles WHERE id = (select auth.uid());
$$ LANGUAGE sql STABLE SECURITY INVOKER;

-- ============================================================
-- Fix RLS policies with (select ...) wrapping to prevent
-- per-row re-evaluation
-- ============================================================

-- visitors
DROP POLICY IF EXISTS "SuperAdmins see all visitors" ON visitors;
DROP POLICY IF EXISTS "GroupAdmins manage own visitors" ON visitors;
DROP POLICY IF EXISTS "Guards see parking visitors today" ON visitors;

CREATE POLICY "SuperAdmins see all visitors" ON visitors FOR ALL TO authenticated
    USING ((select public.user_role()) = 'SuperAdmin');

CREATE POLICY "GroupAdmins manage own visitors" ON visitors FOR ALL TO authenticated
    USING (
        unit_id = (select public.user_unit_id())
        AND (select public.user_role()) = 'GroupAdmin'
    );

CREATE POLICY "Guards see parking visitors today" ON visitors FOR SELECT TO authenticated
    USING (
        needs_parking = TRUE
        AND start_time <= NOW()
        AND expiry_time >= NOW()
        AND (select public.user_role()) = 'Guard'
    );

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated
    USING (id = (select auth.uid()));
