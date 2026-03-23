-- Projekte für Mitglieder: SELECT über user_in_workspace() (siehe 034: row_security off).
-- NICHT per EXISTS auf workspace_members in der Policy — sonst greift RLS wieder auf wm.

DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );
