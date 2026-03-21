-- Workspace-Admins dürfen wieder Überschriften-Overrides für ihren Workspace schreiben (wie 014)

DROP POLICY IF EXISTS "workspace_project_labels_insert" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_insert"
  ON public.workspace_project_labels FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_update" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_update"
  ON public.workspace_project_labels FOR UPDATE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  )
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_delete" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_delete"
  ON public.workspace_project_labels FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  );
