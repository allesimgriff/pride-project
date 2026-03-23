-- E-Mail aus JWT (aktuelle Session) – gleiche Quelle wie der Login, zuverlässiger als nur profiles/auth.users im Definer-Kontext.

CREATE OR REPLACE FUNCTION public.accept_workspace_invite(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.workspace_invites%ROWTYPE;
  user_email text;
BEGIN
  SELECT * INTO inv
  FROM public.workspace_invites
  WHERE token = p_token AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_or_used');
  END IF;

  user_email := nullif(trim(lower((auth.jwt() ->> 'email'))), '');

  IF user_email IS NULL THEN
    SELECT lower(trim(u.email)) INTO user_email FROM auth.users u WHERE u.id = auth.uid();
  END IF;

  IF user_email IS NULL THEN
    SELECT lower(trim(p.email)) INTO user_email FROM public.profiles p WHERE p.id = auth.uid();
  END IF;

  IF user_email IS NULL OR user_email <> lower(trim(inv.email)) THEN
    RETURN json_build_object('ok', false, 'error', 'email_mismatch');
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (inv.workspace_id, auth.uid(), inv.role)
  ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE id = inv.id;

  RETURN json_build_object('ok', true, 'workspace_id', inv.workspace_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_workspace_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invite(text) TO authenticated;
