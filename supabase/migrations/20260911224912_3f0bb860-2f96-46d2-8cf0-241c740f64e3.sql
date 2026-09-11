CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT NOT NULL,
  address TEXT,
  description TEXT NOT NULL,
  social_links TEXT,
  website_type TEXT NOT NULL,
  colors TEXT,
  extra_requests TEXT,
  wants_support BOOLEAN NOT NULL DEFAULT false,
  file_names TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new',
  preview_url TEXT,
  preview_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_spec JSONB;
ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_family TEXT;
ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_locked BOOLEAN NOT NULL DEFAULT false;

GRANT ALL ON public.project_applications TO service_role;

ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages applications" ON public.project_applications;
CREATE POLICY "Service role manages applications"
  ON public.project_applications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');