-- Kategorien pro Workspace; globale Zeilen werden pro Workspace kopiert, dann entfernt.

ALTER TABLE public.project_categories
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces (id) ON DELETE CASCADE;

ALTER TABLE public.project_categories DROP CONSTRAINT IF EXISTS project_categories_prefix_key;

-- Globale Zeilen (workspace_id NULL) je Workspace duplizieren (idempotent)
INSERT INTO public.project_categories (workspace_id, name, prefix, sort_order)
SELECT w.id, c.name, c.prefix, c.sort_order
FROM public.workspaces w
CROSS JOIN public.project_categories c
WHERE c.workspace_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.project_categories x
    WHERE x.workspace_id = w.id
      AND x.prefix = c.prefix
  );

DELETE FROM public.project_categories WHERE workspace_id IS NULL;

ALTER TABLE public.project_categories ALTER COLUMN workspace_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_categories_workspace_prefix_unique
  ON public.project_categories (workspace_id, prefix);

CREATE INDEX IF NOT EXISTS idx_project_categories_workspace ON public.project_categories (workspace_id);

DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON public.project_categories;
DROP POLICY IF EXISTS "Only admins can insert categories" ON public.project_categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON public.project_categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON public.project_categories;

CREATE POLICY "project_categories_select"
  ON public.project_categories FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace (workspace_id)
  );

CREATE POLICY "project_categories_insert"
  ON public.project_categories FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  );

CREATE POLICY "project_categories_update"
  ON public.project_categories FOR UPDATE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  )
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  );

CREATE POLICY "project_categories_delete"
  ON public.project_categories FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin (workspace_id)
  );
