CREATE TABLE IF NOT EXISTS public.preview_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL,
  company TEXT,
  recipient TEXT NOT NULL,
  preview_url TEXT,
  sender TEXT,
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  metadata JSONB,
  kind TEXT,
  revision INTEGER,
  change_request_id UUID,
  idempotency_key TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS sender TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'resend';
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS kind TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS revision INTEGER;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS change_request_id UUID;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.preview_email_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS preview_email_log_reference_idx ON public.preview_email_log (reference, created_at DESC);
CREATE INDEX IF NOT EXISTS preview_email_log_provider_message_idx ON public.preview_email_log (provider_message_id);
CREATE UNIQUE INDEX IF NOT EXISTS preview_email_log_idempotency_key_uidx
  ON public.preview_email_log (idempotency_key) WHERE idempotency_key IS NOT NULL;

GRANT ALL ON public.preview_email_log TO service_role;

ALTER TABLE public.preview_email_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'preview_email_log'
      AND policyname = 'Service role manages preview email log'
  ) THEN
    CREATE POLICY "Service role manages preview email log"
      ON public.preview_email_log FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.preview_email_log_touch()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preview_email_log_set_updated_at ON public.preview_email_log;
CREATE TRIGGER preview_email_log_set_updated_at
BEFORE UPDATE ON public.preview_email_log
FOR EACH ROW EXECUTE FUNCTION public.preview_email_log_touch();