-- Überschriften pro Workspace (Overrides; Basis bleibt public.project_labels)

CREATE TABLE IF NOT EXISTS public.workspace_project_labels (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key text NOT NULL,
  label_de text NOT NULL,
  label_en text NOT NULL,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, key)
);

CREATE INDEX IF NOT EXISTS idx_workspace_project_labels_workspace
  ON public.workspace_project_labels(workspace_id);

ALTER TABLE public.workspace_project_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_project_labels_select" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_select"
  ON public.workspace_project_labels FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_insert" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_insert"
  ON public.workspace_project_labels FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_update" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_update"
  ON public.workspace_project_labels FOR UPDATE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  )
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_delete" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_delete"
  ON public.workspace_project_labels FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );
