-- Migration: Create tag_requests table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.tag_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignee_first_name TEXT NOT NULL,
    assignee_last_name TEXT NOT NULL,
    assignee_role TEXT NOT NULL,
    assignee_phone TEXT NOT NULL,
    credential_type TEXT NOT NULL CHECK (credential_type IN ('nfc', 'biometric')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Rejected'))
);

-- RLS: Enable row-level security
ALTER TABLE public.tag_requests ENABLE ROW LEVEL SECURITY;

-- GroupAdmins can insert their own unit's requests
CREATE POLICY "GroupAdmins can create tag requests for their unit"
ON public.tag_requests FOR INSERT
WITH CHECK (
    auth.uid() = requested_by AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.unit_id = tag_requests.unit_id
    )
);

-- GroupAdmins can view their own unit's requests
CREATE POLICY "GroupAdmins can view their unit's requests"
ON public.tag_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.unit_id = tag_requests.unit_id
    )
);

-- SuperAdmins can view and update all requests
CREATE POLICY "SuperAdmins can manage all tag requests"
ON public.tag_requests FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'SuperAdmin'
    )
);
