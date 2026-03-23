-- Falls 025 bereits mit Spalte user_role ausgeführt wurde: Funktion neu anlegen (PostgREST/RPC kompatibel).
DROP FUNCTION IF EXISTS public.get_invite_for_registration(uuid);

CREATE FUNCTION public.get_invite_for_registration(p_token uuid)
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
