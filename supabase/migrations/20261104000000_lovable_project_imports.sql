-- Apply only to the authoritative Din Webbpartner database after verifying HUB_STORE.
-- This migration does not modify customer orders or publish any website.
CREATE TABLE IF NOT EXISTS public.lovable_project_imports (
  reference TEXT PRIMARY KEY REFERENCES public.project_applications(reference) ON DELETE CASCADE,
  lovable_project_id TEXT NOT NULL,
  lovable_commit TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  design_brief TEXT NOT NULL,
  design_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_import_status TEXT NOT NULL DEFAULT 'awaiting_source_archive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No anonymous access; the authenticated admin server route is the only importer.
ALTER TABLE public.lovable_project_imports ENABLE ROW LEVEL SECURITY;
