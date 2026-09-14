ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS intent_reason TEXT;
ALTER TABLE public.customer_change_requests ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS design_revision INTEGER;
ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS customer_approved_at TIMESTAMPTZ;
ALTER TABLE public.project_applications ADD COLUMN IF NOT EXISTS review_note TEXT;