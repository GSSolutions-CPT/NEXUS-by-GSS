-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Units Table (14 Business + 12 Penthouse)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Business' CHECK (type IN ('Business', 'Residential')),
    floor TEXT,
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Access Groups (Mirrors the physical Impro Access Group IDs)
CREATE TABLE access_groups (
    id INTEGER PRIMARY KEY, -- Matches the exact ID in Impro software
    name TEXT NOT NULL,
    description TEXT
);

-- 3. Unit Access Mapping (Which units are allowed to grant which access groups)
CREATE TABLE unit_access_mapping (
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    access_group_id INTEGER REFERENCES access_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (unit_id, access_group_id)
);

-- 4. User Profiles (Extends Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    role TEXT CHECK (role IN ('SuperAdmin', 'GroupAdmin', 'Guard')),
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL, -- Null if they are a Guard or SuperAdmin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. QR Codes (1 per unit — permanent static access tag)
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
    qr_value TEXT UNIQUE NOT NULL,       -- unique identifier string linked to access control tag
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Visitors
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    needs_parking BOOLEAN DEFAULT FALSE,
    pin_code TEXT UNIQUE NOT NULL, -- The generated Wiegand-compliant PIN
    start_time TIMESTAMPTZ NOT NULL,
    expiry_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Expired', 'Revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Audit Logs (system-wide activity trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES visitors(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_name TEXT,
    details TEXT,
    performed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. QR Access Logs (hardware scan events)
CREATE TABLE qr_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    access_point TEXT NOT NULL,       -- e.g. "Main Entrance", "Parking Gate B"
    event_type TEXT DEFAULT 'entry' CHECK (event_type IN ('entry', 'exit', 'denied')),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- SECURITY: Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile data so subqueries evaluate successfully
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_access_logs ENABLE ROW LEVEL SECURITY;

-- Optimized helper functions for RLS to prevent N+1 subquery bottlenecks
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_unit_id() RETURNS uuid AS $$
  SELECT unit_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- SuperAdmins can see everything
CREATE POLICY "SuperAdmins see all visitors" ON visitors FOR ALL TO authenticated USING (auth.user_role() = 'SuperAdmin');

-- GroupAdmins (Unit Owners) can only see and manage visitors for their own unit
CREATE POLICY "GroupAdmins manage own visitors" ON visitors FOR ALL TO authenticated USING (
    unit_id = auth.user_unit_id() 
    AND auth.user_role() = 'GroupAdmin'
);

-- Guards can see visitors if they are active and need parking for today
CREATE POLICY "Guards see parking visitors today" ON visitors FOR SELECT TO authenticated USING (
    needs_parking = TRUE 
    AND start_time <= NOW() 
    AND expiry_time >= NOW()
    AND auth.user_role() = 'Guard'
);

-- QR Codes: SuperAdmins full access, owners read-only
CREATE POLICY "SuperAdmins manage all QR codes" ON qr_codes FOR ALL TO authenticated USING (auth.user_role() = 'SuperAdmin');
CREATE POLICY "Owners view own QR code" ON qr_codes FOR SELECT TO authenticated USING (unit_id = auth.user_unit_id() AND auth.user_role() = 'GroupAdmin');

-- QR Access Logs: SuperAdmins see all, owners see own unit
CREATE POLICY "SuperAdmins view all QR access logs" ON qr_access_logs FOR ALL TO authenticated USING (auth.user_role() = 'SuperAdmin');
CREATE POLICY "Owners view own QR access logs" ON qr_access_logs FOR SELECT TO authenticated USING (unit_id = auth.user_unit_id() AND auth.user_role() = 'GroupAdmin');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_unit_id ON qr_codes(unit_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_value ON qr_codes(qr_value);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_unit_id ON qr_access_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_scanned_at ON qr_access_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_qr_code_id ON qr_access_logs(qr_code_id);
