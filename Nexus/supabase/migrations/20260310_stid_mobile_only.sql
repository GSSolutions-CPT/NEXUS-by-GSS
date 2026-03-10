-- Migration: Update tag_requests to STID mobile credential only
-- Add email column and update the credential_type constraint

ALTER TABLE public.tag_requests
    ADD COLUMN IF NOT EXISTS assignee_email TEXT;

-- Remove old credential_type constraint and replace with stid_mobile only
ALTER TABLE public.tag_requests
    DROP CONSTRAINT IF EXISTS tag_requests_credential_type_check;

ALTER TABLE public.tag_requests
    ADD CONSTRAINT tag_requests_credential_type_check
    CHECK (credential_type = 'stid_mobile');

-- Update any legacy rows that had nfc/biometric to stid_mobile
UPDATE public.tag_requests
    SET credential_type = 'stid_mobile'
    WHERE credential_type IN ('nfc', 'biometric');
