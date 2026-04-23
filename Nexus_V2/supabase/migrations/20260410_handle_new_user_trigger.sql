-- ================================================================
-- Migration: Auto-create profiles row on auth.users INSERT
--
-- CRITICAL FIX: Without this trigger, when a user is created via
-- admin.createUser() or the dashboard, no profiles row exists.
-- The login page has a retry loop as a workaround, but this is
-- the proper solution — a Postgres trigger fires AFTER INSERT
-- on auth.users to create the stub profile row.
--
-- The API route (/api/admin/users) then UPDATEs this row with
-- the correct role, unit_id, and names.
-- ================================================================

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'role', 'GroupAdmin')
    )
    ON CONFLICT (id) DO NOTHING;  -- Idempotent: skip if profile already exists
    RETURN NEW;
END;
$$;

-- Step 2: Create the trigger on auth.users
-- Drop first to make this migration re-runnable
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
