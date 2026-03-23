-- Workspace-Mitgliedsrolle (member/admin) ändern: fehlte bisher eine UPDATE-Policy.

CREATE POLICY "workspace_members_update"
  ON public.workspace_members FOR UPDATE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  )
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );
