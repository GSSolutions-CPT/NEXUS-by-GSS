-- ============================================================
-- Fix #4: Add missing RLS policies for units, access_groups,
--         unit_access_mapping, and audit_logs
-- ============================================================
-- These tables have RLS enabled but ZERO policies, meaning
-- authenticated client queries return 0 rows.

-- ==================== units ====================
-- Any authenticated user can read unit names (not sensitive)
CREATE POLICY "Authenticated users can read units"
    ON units FOR SELECT TO authenticated USING (true);

-- Only SuperAdmin can create/update/delete units
CREATE POLICY "SuperAdmins manage units"
    ON units FOR ALL TO authenticated
    USING ((select auth.user_role()) = 'SuperAdmin')
    WITH CHECK ((select auth.user_role()) = 'SuperAdmin');

-- ==================== access_groups ====================
ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read access_groups"
    ON access_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "SuperAdmins manage access_groups"
    ON access_groups FOR ALL TO authenticated
    USING ((select auth.user_role()) = 'SuperAdmin')
    WITH CHECK ((select auth.user_role()) = 'SuperAdmin');

-- ==================== unit_access_mapping ====================
ALTER TABLE unit_access_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read unit_access_mapping"
    ON unit_access_mapping FOR SELECT TO authenticated USING (true);

CREATE POLICY "SuperAdmins manage unit_access_mapping"
    ON unit_access_mapping FOR ALL TO authenticated
    USING ((select auth.user_role()) = 'SuperAdmin')
    WITH CHECK ((select auth.user_role()) = 'SuperAdmin');

-- ==================== audit_logs ====================
-- Users can read audit logs scoped to their own unit; SuperAdmins see all
CREATE POLICY "Users can read own unit audit_logs"
    ON audit_logs FOR SELECT TO authenticated
    USING (
        unit_id = (select auth.user_unit_id())
        OR (select auth.user_role()) = 'SuperAdmin'
    );

-- Only service role (via Bridge API) inserts audit logs, so no INSERT policy
-- needed for authenticated users. If needed later:
-- CREATE POLICY "SuperAdmins insert audit_logs"
--     ON audit_logs FOR INSERT TO authenticated
--     WITH CHECK ((select auth.user_role()) = 'SuperAdmin');
