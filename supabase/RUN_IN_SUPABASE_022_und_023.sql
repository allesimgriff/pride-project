-- =============================================================================
-- PRIDE: Einmalig in Supabase ausführen (SQL Editor), WENN noch nicht geschehen:
--   - 022: Kategorien pro Workspace + RLS
--   - 023: Workspace-Admins dürfen workspace_project_labels schreiben (Kopfzeile etc.)
--
-- Neuinstallation von null: besser das komplette Bundle nutzen:
--   supabase/ALL_MIGRATIONS_ONE_FILE.sql
-- oder alle Migrationen 001 … in Reihenfolge.
--
-- Hinweis: 022 nicht zweimal auf derselben DB ausführen, wenn sie schon lief
-- (kann je nach Zustand Fehler an ALTER … NOT NULL geben).
-- =============================================================================

-- 022_project_categories_per_workspace.sql
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

-- 023_workspace_project_labels_workspace_admin_write.sql
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
