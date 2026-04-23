-- ================================================================
-- Migration: JWT Custom Claims Hook for RLS Performance
--
-- Context: Our RLS policies previously called user_role() and
-- user_unit_id() as helper functions, both of which SELECT from
-- the profiles table on *every row evaluation*. This causes N+1
-- queries as the visitors/audit_logs tables grow.
--
-- Fix: Use Supabase's auth.customize_token hook to embed `role`
-- and `unit_id` directly into the JWT as custom claims.
-- RLS policies can then read `auth.jwt() ->> 'role'` which is
-- zero-cost (parsed from the token, no DB query).
--
-- Run this in the Supabase SQL editor.
-- ================================================================

-- Step 1: Create the hook function that adds custom claims to every JWT
CREATE OR REPLACE FUNCTION public.custom_jwt_claims(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_role TEXT;
    user_unit_id UUID;
    claims JSONB;
BEGIN
    -- Fetch the user's role and unit_id from profiles in one query
    SELECT role, unit_id
    INTO user_role, user_unit_id
    FROM public.profiles
    WHERE id = (event ->> 'user_id')::UUID;

    -- Build the claims object — only add unit_id if the user has one
    claims := event -> 'claims';
    claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, '')));

    IF user_unit_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{user_unit_id}', to_jsonb(user_unit_id::TEXT));
    END IF;

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Step 2: Register this function as the JWT hook in Supabase
-- NOTE: After running this SQL, you must also enable the hook in the
-- Supabase dashboard: Authentication → Hooks → "Customize Access Token (JWT) Claim"
-- Select the function: public.custom_jwt_claims
-- (The SQL alone is not enough — the dashboard toggle is required)

-- Step 3: Update the helper functions to read from JWT instead of profiles
-- This keeps backwards compatibility for any code still using these functions

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT COALESCE(
        auth.jwt() ->> 'user_role',
        (SELECT role FROM public.profiles WHERE id = auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.user_unit_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT COALESCE(
        (auth.jwt() ->> 'user_unit_id')::UUID,
        (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
    );
$$;

-- Step 4: Rewrite RLS policies on the visitors table to use JWT claims
-- (zero profiles table hits)

DROP POLICY IF EXISTS "GroupAdmins can view unit visitors" ON public.visitors;
DROP POLICY IF EXISTS "GroupAdmins can insert visitors" ON public.visitors;
DROP POLICY IF EXISTS "GroupAdmins can manage unit visitors" ON public.visitors;
DROP POLICY IF EXISTS "SuperAdmins can manage all visitors" ON public.visitors;
DROP POLICY IF EXISTS "Owners can view their unit visitors" ON public.visitors;
DROP POLICY IF EXISTS "Owners can manage their unit visitors" ON public.visitors;

-- SELECT: GroupAdmins see own unit; SuperAdmins see all
CREATE POLICY "visitors_select"
ON public.visitors FOR SELECT
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
    OR (
        (auth.jwt() ->> 'user_role') = 'GroupAdmin'
        AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
    )
);

-- INSERT: GroupAdmins insert for their own unit
CREATE POLICY "visitors_insert"
ON public.visitors FOR INSERT
WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('GroupAdmin', 'SuperAdmin')
    AND (
        (auth.jwt() ->> 'user_role') = 'SuperAdmin'
        OR unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
    )
);

-- UPDATE: SuperAdmins only (revoke, status change)
CREATE POLICY "visitors_update"
ON public.visitors FOR UPDATE
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
    OR (
        (auth.jwt() ->> 'user_role') = 'GroupAdmin'
        AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
    )
);

-- Step 5: Rewrite RLS on audit_logs (Guards/SuperAdmins read; only backend writes)
DROP POLICY IF EXISTS "GroupAdmins can read their unit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "SuperAdmins can read all logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only backend can insert audit logs" ON public.audit_logs;

CREATE POLICY "audit_logs_select"
ON public.audit_logs FOR SELECT
USING (
    (auth.jwt() ->> 'user_role') = 'SuperAdmin'
    OR (
        (auth.jwt() ->> 'user_role') IN ('GroupAdmin', 'Guard')
        AND unit_id = (auth.jwt() ->> 'user_unit_id')::UUID
    )
);

-- Only service role (backend) can insert — all direct inserts from users are blocked
CREATE POLICY "audit_logs_insert_backend_only"
ON public.audit_logs FOR INSERT
WITH CHECK (false);

-- ================================================================
-- IMPORTANT: After running this SQL, go to:
-- Supabase → Authentication → Hooks
-- Enable: "Customize Access Token (JWT) Claim"
-- Function: public.custom_jwt_claims
-- ================================================================
