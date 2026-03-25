-- ============================================================
-- Add missing RLS policies for units, access_groups,
-- unit_access_mapping, and audit_logs
-- ============================================================

-- ==================== units ====================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read units"
    ON units FOR SELECT TO authenticated USING (true);

CREATE POLICY "SuperAdmins manage units"
    ON units FOR ALL TO authenticated
    USING ((select public.user_role()) = 'SuperAdmin')
    WITH CHECK ((select public.user_role()) = 'SuperAdmin');

-- ==================== access_groups ====================
ALTER TABLE access_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read access_groups"
    ON access_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "SuperAdmins manage access_groups"
    ON access_groups FOR ALL TO authenticated
    USING ((select public.user_role()) = 'SuperAdmin')
    WITH CHECK ((select public.user_role()) = 'SuperAdmin');

-- ==================== unit_access_mapping ====================
ALTER TABLE unit_access_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read unit_access_mapping"
    ON unit_access_mapping FOR SELECT TO authenticated USING (true);

CREATE POLICY "SuperAdmins manage unit_access_mapping"
    ON unit_access_mapping FOR ALL TO authenticated
    USING ((select public.user_role()) = 'SuperAdmin')
    WITH CHECK ((select public.user_role()) = 'SuperAdmin');

-- ==================== audit_logs ====================
CREATE POLICY "Users can read own unit audit_logs"
    ON audit_logs FOR SELECT TO authenticated
    USING (
        unit_id = (select public.user_unit_id())
        OR (select public.user_role()) = 'SuperAdmin'
    );
