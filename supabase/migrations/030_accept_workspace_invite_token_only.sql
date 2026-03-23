-- Workspace-Einladung: gültiger Token + angemeldeter Nutzer genügen.
-- Die E-Mail in workspace_invites bleibt für Versand/Audit, blockiert aber den Beitritt nicht mehr
-- (verhindert endlose „falsche E-Mail“-Fälle durch Profil-/JWT-Abweichungen).

CREATE OR REPLACE FUNCTION public.accept_workspace_invite(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.workspace_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO inv
  FROM public.workspace_invites
  WHERE token = p_token AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_or_used');
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
