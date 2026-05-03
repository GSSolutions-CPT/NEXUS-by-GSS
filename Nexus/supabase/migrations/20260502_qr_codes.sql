-- QR Codes table: Each unit gets exactly one permanent static QR code
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE UNIQUE,
    qr_value TEXT UNIQUE NOT NULL,       -- unique identifier string linked to access control tag
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- SuperAdmins have full access to all QR codes
CREATE POLICY "SuperAdmins manage all QR codes" ON qr_codes
    FOR ALL TO authenticated
    USING (auth.user_role() = 'SuperAdmin');

-- GroupAdmins (unit owners) can only view their own unit's QR code
CREATE POLICY "Owners view own QR code" ON qr_codes
    FOR SELECT TO authenticated
    USING (
        unit_id = auth.user_unit_id()
        AND auth.user_role() = 'GroupAdmin'
    );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_qr_codes_unit_id ON qr_codes(unit_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_qr_value ON qr_codes(qr_value);
