CREATE TABLE IF NOT EXISTS public.customer_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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

CREATE UNIQUE INDEX IF NOT EXISTS customer_change_requests_message_id_key
  ON public.customer_change_requests (message_id);
CREATE INDEX IF NOT EXISTS customer_change_requests_reference_idx
  ON public.customer_change_requests (reference, received_at DESC);

GRANT ALL ON public.customer_change_requests TO service_role;
ALTER TABLE public.customer_change_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.application_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  event_type TEXT NOT NULL,
  label TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_events_reference_idx
  ON public.application_events (reference, created_at DESC);

GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;