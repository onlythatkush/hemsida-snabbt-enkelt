CREATE TABLE IF NOT EXISTS public.preview_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL,
  company text,
  recipient text NOT NULL,
  preview_url text,
  sender text,
  provider text NOT NULL,
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued',
  error_message text,
  metadata jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS preview_email_log_reference_idx ON public.preview_email_log (reference, created_at DESC);
CREATE INDEX IF NOT EXISTS preview_email_log_provider_message_id_idx ON public.preview_email_log (provider_message_id);

GRANT ALL ON public.preview_email_log TO service_role;

ALTER TABLE public.preview_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages preview email log"
ON public.preview_email_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.preview_email_log_touch()
RETURNS trigger
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