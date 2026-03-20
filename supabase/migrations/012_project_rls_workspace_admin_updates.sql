-- App-Admin darf Projekte in jedem Workspace anlegen (ohne Mitgliedschaft).
-- Projekt-Stammdaten (projects-Zeile): nur App-Admin oder Workspace-Admin änderbar/löschbar.
-- (Kommentare, Dateien, Aufgaben, Historie bleiben über project_accessible für alle Mitglieder.)

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND created_by = auth.uid()
    AND (
      public.is_app_admin()
      OR public.user_in_workspace(workspace_id)
    )
  );

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  )
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );
