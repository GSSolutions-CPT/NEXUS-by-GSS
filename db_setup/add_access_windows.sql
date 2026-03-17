-- ============================================================
-- Create the 'visitors' table
-- ============================================================
-- This table stores visitor pass records created by GroupAdmins/Owners.
-- Each visitor gets a unique PIN code for gate access.
-- access_windows stores per-day time slots as JSONB.

CREATE TABLE IF NOT EXISTS visitors (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    phone           TEXT NOT NULL,
    pin_code        TEXT NOT NULL UNIQUE,
    start_time      TIMESTAMPTZ NOT NULL,
    expiry_time     TIMESTAMPTZ NOT NULL,
    needs_parking   BOOLEAN DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'Pending'
                    CHECK (status IN ('Pending', 'Active', 'Revoked', 'Expired')),
    access_windows  JSONB DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by unit
CREATE INDEX IF NOT EXISTS idx_visitors_unit_id ON visitors(unit_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);

-- Index for PIN lookups (already enforced by UNIQUE, but explicit)
CREATE INDEX IF NOT EXISTS idx_visitors_pin ON visitors(pin_code);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read visitors belonging to their own unit
CREATE POLICY "Users can view own unit visitors"
    ON visitors FOR SELECT
    USING (
        unit_id IN (
            SELECT unit_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can insert visitors for their own unit
CREATE POLICY "Users can create visitors for own unit"
    ON visitors FOR INSERT
    WITH CHECK (
        unit_id IN (
            SELECT unit_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: Users can update (revoke) visitors for their own unit
CREATE POLICY "Users can update own unit visitors"
    ON visitors FOR UPDATE
    USING (
        unit_id IN (
            SELECT unit_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Policy: SuperAdmins can do everything
CREATE POLICY "SuperAdmins full access to visitors"
    ON visitors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SuperAdmin'
        )
    );

-- Policy: Allow public read access for guest pass pages (by visitor ID)
-- This lets unauthenticated users view their own pass via the /guest/[id] link
CREATE POLICY "Public can view individual visitor pass"
    ON visitors FOR SELECT
    USING (true);
