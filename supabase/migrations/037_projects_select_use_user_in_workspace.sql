-- WICHTIG: 035 nutzte EXISTS auf workspace_members → RLS des Aufrufers blockiert oft.
-- Diese Datei: Policy nur über user_in_workspace() (bereits mit SET row_security = off in 034).
-- Zusätzlich alte Policy-Namen aus 010 entfernen, falls sie je wieder auftaucht.

DROP POLICY IF EXISTS "Project select for members" ON public.projects;

DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );
