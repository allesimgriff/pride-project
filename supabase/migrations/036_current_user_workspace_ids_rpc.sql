-- Workspace-IDs des eingeloggten Users für UI (inAnyWorkspace) ohne Abhängigkeit von
-- workspace_members-RLS beim direkten SELECT (gleiche Idee wie 034).

CREATE OR REPLACE FUNCTION public.current_user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT wm.workspace_id
  FROM public.workspace_members wm
  WHERE wm.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_workspace_ids() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_workspace_ids() TO authenticated;
