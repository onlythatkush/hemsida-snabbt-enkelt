-- ============ Core tables (idempotent) ============
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_applications
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS preview_token TEXT,
  ADD COLUMN IF NOT EXISTS design_spec JSONB,
  ADD COLUMN IF NOT EXISTS design_family TEXT,
  ADD COLUMN IF NOT EXISTS design_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qa_status TEXT,
  ADD COLUMN IF NOT EXISTS qa_score INTEGER,
  ADD COLUMN IF NOT EXISTS qa_report JSONB,
  ADD COLUMN IF NOT EXISTS qa_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS design_revision INTEGER,
  ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_revision INTEGER,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE TABLE IF NOT EXISTS public.preview_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  company TEXT,
  recipient TEXT NOT NULL,
  preview_url TEXT,
  sender TEXT,
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.preview_email_log
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'preview_ready',
  ADD COLUMN IF NOT EXISTS revision INTEGER,
  ADD COLUMN IF NOT EXISTS change_request_id UUID,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS preview_email_log_idempotency_key_uidx
  ON public.preview_email_log (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS preview_email_log_reference_idx
  ON public.preview_email_log (reference, created_at DESC);
CREATE INDEX IF NOT EXISTS preview_email_log_provider_message_idx
  ON public.preview_email_log (provider_message_id) WHERE provider_message_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.customer_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  directives JSONB,
  from_email TEXT,
  message_id TEXT NOT NULL,
  matched_via TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  revision INTEGER,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_change_requests
  ADD COLUMN IF NOT EXISTS intent TEXT,
  ADD COLUMN IF NOT EXISTS intent_reason TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS classifier TEXT,
  ADD COLUMN IF NOT EXISTS extracted JSONB,
  ADD COLUMN IF NOT EXISTS routing TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS customer_change_requests_message_id_uidx
  ON public.customer_change_requests (message_id);
CREATE INDEX IF NOT EXISTS customer_change_requests_reference_idx
  ON public.customer_change_requests (reference, received_at DESC);

CREATE TABLE IF NOT EXISTS public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  event_type TEXT NOT NULL,
  label TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS application_events_reference_idx
  ON public.application_events (reference, created_at DESC);

-- ============ Immutable design version history ============
CREATE TABLE IF NOT EXISTS public.design_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  revision INTEGER NOT NULL,
  design_spec JSONB NOT NULL,
  design_family TEXT,
  design_version INTEGER,
  preview_url TEXT,
  qa_status TEXT,
  qa_score INTEGER,
  qa_report JSONB,
  source TEXT NOT NULL DEFAULT 'admin',
  change_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS design_versions_reference_revision_uidx
  ON public.design_versions (reference, revision);
CREATE INDEX IF NOT EXISTS design_versions_reference_idx
  ON public.design_versions (reference, created_at DESC);

-- ============ Revision jobs ============
CREATE TABLE IF NOT EXISTS public.revision_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  change_request_id UUID,
  kind TEXT NOT NULL DEFAULT 'design_revision',
  status TEXT NOT NULL DEFAULT 'queued',
  revision INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  detail JSONB,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS revision_jobs_idempotency_key_uidx
  ON public.revision_jobs (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS revision_jobs_reference_idx
  ON public.revision_jobs (reference, created_at DESC);

-- ============ Grants and RLS (service role only) ============
GRANT ALL ON public.project_applications TO service_role;
GRANT ALL ON public.preview_email_log TO service_role;
GRANT ALL ON public.customer_change_requests TO service_role;
GRANT ALL ON public.application_events TO service_role;
GRANT ALL ON public.design_versions TO service_role;
GRANT ALL ON public.revision_jobs TO service_role;

ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preview_email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='design_versions' AND policyname='Service role manages design versions') THEN
    CREATE POLICY "Service role manages design versions" ON public.design_versions
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='revision_jobs' AND policyname='Service role manages revision jobs') THEN
    CREATE POLICY "Service role manages revision jobs" ON public.revision_jobs
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='application_events' AND policyname='Service role manages application events') THEN
    CREATE POLICY "Service role manages application events" ON public.application_events
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customer_change_requests' AND policyname='Service role manages change requests') THEN
    CREATE POLICY "Service role manages change requests" ON public.customer_change_requests
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='project_applications' AND policyname='Service role manages applications') THEN
    CREATE POLICY "Service role manages applications" ON public.project_applications
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Keep updated_at fresh on the hub tables
CREATE OR REPLACE FUNCTION public.hub_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS revision_jobs_set_updated_at ON public.revision_jobs;
CREATE TRIGGER revision_jobs_set_updated_at BEFORE UPDATE ON public.revision_jobs
  FOR EACH ROW EXECUTE FUNCTION public.hub_touch_updated_at();