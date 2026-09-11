-- DinWebbPartner project applications
-- Stores the customer brief independently of email delivery.

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
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','building','preview','changes','approved','paid','delivered','archived')),
  preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_project_applications_created ON public.project_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications(status);

-- Public users never write directly to this table. The server API uses service_role.
DO $$ BEGIN
  CREATE POLICY "Service role manages project applications"
  ON public.project_applications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
