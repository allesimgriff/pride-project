-- Öffentlicher Lesezugriff auf Einladungen nur per Token (Registrierung ohne Login).
-- Bisher: SELECT auf invites nur für "authenticated" → anonyme Nutzer sahen keine Zeile.

CREATE OR REPLACE FUNCTION public.get_invite_for_registration(p_token uuid)
RETURNS TABLE (
  email text,
  full_name text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.email, i.full_name, i.role::text
  FROM public.invites i
  WHERE i.token = p_token
    AND i.accepted_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_for_registration(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_for_registration(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invite_for_registration(uuid) TO authenticated;
