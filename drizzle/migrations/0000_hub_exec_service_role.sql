CREATE OR REPLACE FUNCTION public.hub_exec(q text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  head text := lower(substring(ltrim(q) from 1 for 7));
  result jsonb;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
     AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'hub_exec: service_role only';
  END IF;
  IF NOT (head LIKE 'select%' OR head LIKE 'with%' OR head LIKE 'insert%' OR head LIKE 'update%' OR head LIKE 'delete%') THEN
    RAISE EXCEPTION 'hub_exec: only SELECT/WITH/INSERT/UPDATE/DELETE allowed';
  END IF;
  IF position(';' in rtrim(rtrim(q), ';')) > 0 THEN
    RAISE EXCEPTION 'hub_exec: single statement only';
  END IF;
  IF head LIKE 'select%' OR head LIKE 'with%' OR q ~* '\mreturning\M' THEN
    EXECUTE 'WITH hub_t AS (' || rtrim(rtrim(q), ';') || ') SELECT coalesce(jsonb_agg(to_jsonb(hub_t)), ''[]''::jsonb) FROM hub_t' INTO result;
  ELSE
    EXECUTE q;
    result := '[]'::jsonb;
  END IF;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.hub_exec(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hub_exec(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hub_exec(text) TO service_role;