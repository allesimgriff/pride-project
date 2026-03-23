-- Einmal im Supabase SQL Editor ausführen (PRODUCTION = dieselbe DB wie die App):
-- 1) user_in_workspace mit SET row_security = off (034)
-- 2) projects_select nur über diese Funktion, alte Policy-Namen bereinigen (037)

CREATE OR REPLACE FUNCTION public.user_in_workspace(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = wid AND wm.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_in_workspace(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.user_in_workspace(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.user_is_workspace_admin(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = wid
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_workspace_admin(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.user_is_workspace_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Project select for members" ON public.projects;

DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );
