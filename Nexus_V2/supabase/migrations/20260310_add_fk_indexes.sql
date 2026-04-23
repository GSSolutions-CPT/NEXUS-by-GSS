-- Add indexes on foreign key columns to fix unindexed_foreign_keys linter warnings

CREATE INDEX IF NOT EXISTS idx_tag_requests_unit_id
    ON public.tag_requests(unit_id);

CREATE INDEX IF NOT EXISTS idx_tag_requests_requested_by
    ON public.tag_requests(requested_by);

CREATE INDEX IF NOT EXISTS idx_unit_access_mapping_access_group_id
    ON public.unit_access_mapping(access_group_id);
