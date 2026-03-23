-- Nach Registrierung: Einladung als angenommen markieren (RLS erlaubt kein anon-UPDATE auf invites).

CREATE OR REPLACE FUNCTION public.mark_invite_accepted(p_token uuid, p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  UPDATE public.invites
  SET accepted_at = NOW()
  WHERE token = p_token
    AND accepted_at IS NULL
    AND lower(trim(email)) = lower(trim(p_email));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_invite_accepted(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_invite_accepted(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_invite_accepted(uuid, text) TO authenticated;
