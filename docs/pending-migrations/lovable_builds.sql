-- PENDING (needs approval): additive only. Apply to the authoritative hub database.
CREATE TABLE IF NOT EXISTS public.lovable_builds (
  reference TEXT PRIMARY KEY,
  lovable_project_id TEXT UNIQUE,
  lovable_commit TEXT,
  preview_url TEXT,
  status TEXT NOT NULL DEFAULT 'brief_ready',
  design_brief TEXT,
  design_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  files_source TEXT NOT NULL DEFAULT 'none',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.lovable_builds TO service_role;
ALTER TABLE public.lovable_builds ENABLE ROW LEVEL SECURITY;
