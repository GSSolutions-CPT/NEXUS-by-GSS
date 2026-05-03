-- QR Access Logs: Tracks access events from hardware scanners (synced or manual)
-- This table stores when a QR code was scanned at an access point
CREATE TABLE IF NOT EXISTS qr_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    access_point TEXT NOT NULL,       -- e.g. "Main Entrance", "Parking Gate B"
    event_type TEXT DEFAULT 'entry' CHECK (event_type IN ('entry', 'exit', 'denied')),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb  -- extra data from hardware (reader_id, etc.)
);

-- Enable RLS
ALTER TABLE qr_access_logs ENABLE ROW LEVEL SECURITY;

-- SuperAdmins can see all access logs
CREATE POLICY "SuperAdmins view all QR access logs" ON qr_access_logs
    FOR ALL TO authenticated
    USING (auth.user_role() = 'SuperAdmin');

-- Owners can only view their own unit's access logs
CREATE POLICY "Owners view own QR access logs" ON qr_access_logs
    FOR SELECT TO authenticated
    USING (
        unit_id = auth.user_unit_id()
        AND auth.user_role() = 'GroupAdmin'
    );

-- Service role can insert logs (from hardware bridge or admin API)
-- (Service role bypasses RLS by default, so no explicit policy needed)

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_unit_id ON qr_access_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_scanned_at ON qr_access_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_access_logs_qr_code_id ON qr_access_logs(qr_code_id);
