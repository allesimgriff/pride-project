-- =============================================================================
-- 011_workspaces.sql
-- =============================================================================

-- Workspaces (gruppenartig): Mitglieder sehen alle Projekte des Workspace.
-- Ersetzt die rein über is_project_member() gesteuerte Sicht (010).

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user_id ON public.workspace_members (user_id);

CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_workspace_invites_pending_email
  ON public.workspace_invites (workspace_id, lower(trim(email)))
  WHERE accepted_at IS NULL;

CREATE INDEX idx_workspace_invites_token ON public.workspace_invites (token)
  WHERE accepted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Projekte: Workspace-Zuordnung + Entwicklungsnummer pro Workspace eindeutig
-- ---------------------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces (id) ON DELETE RESTRICT;

DO $$
DECLARE
  wid uuid;
  first_user uuid;
BEGIN
  SELECT id INTO first_user FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  IF first_user IS NULL THEN
    RAISE EXCEPTION 'Keine Profile: Workspace-Migration nicht möglich.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.workspaces) THEN
    INSERT INTO public.workspaces (name, created_by)
    VALUES ('Haupt-Workspace', first_user)
    RETURNING id INTO wid;
  ELSE
    SELECT id INTO wid FROM public.workspaces ORDER BY created_at ASC LIMIT 1;
  END IF;

  UPDATE public.projects SET workspace_id = wid WHERE workspace_id IS NULL;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  SELECT wid, p.id,
    CASE WHEN p.role = 'admin'::user_role THEN 'admin' ELSE 'member' END
  FROM public.profiles p
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
END $$;

ALTER TABLE public.projects ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_dev_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_workspace_dev_number
  ON public.projects (workspace_id, dev_number);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects (workspace_id);

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen (RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_app_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.user_in_workspace(wid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.project_accessible(pid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = pid
      AND (
        public.is_app_admin()
        OR public.user_in_workspace(p.workspace_id)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.project_accessible(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.project_accessible(uuid) TO authenticated;

-- Einladung annehmen (Token + eingeloggter User = E-Mail der Einladung)
CREATE OR REPLACE FUNCTION public.accept_workspace_invite(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.workspace_invites%ROWTYPE;
  prof_email text;
BEGIN
  SELECT * INTO inv
  FROM public.workspace_invites
  WHERE token = p_token AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_or_used');
  END IF;

  SELECT email INTO prof_email FROM public.profiles WHERE id = auth.uid();
  IF prof_email IS NULL OR lower(trim(prof_email)) <> lower(trim(inv.email)) THEN
    RETURN json_build_object('ok', false, 'error', 'email_mismatch');
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (inv.workspace_id, auth.uid(), inv.role)
  ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;

  UPDATE public.workspace_invites
  SET accepted_at = now()
  WHERE id = inv.id;

  RETURN json_build_object('ok', true, 'workspace_id', inv.workspace_id);
END;
$$;

REVOKE ALL ON FUNCTION public.accept_workspace_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_workspace_invite(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Alte Projekt-RLS / Funktion entfernen, neue Policies
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Project select for members" ON public.projects;
DROP POLICY IF EXISTS "Project insert with owner" ON public.projects;
DROP POLICY IF EXISTS "Project update for members" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IS NOT NULL
    AND created_by = auth.uid()
    AND public.user_in_workspace(workspace_id)
  );

CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.project_accessible(id))
  WITH CHECK (public.project_accessible(id));

CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );

-- Abhängige Tabellen: project_accessible statt is_project_member
DROP POLICY IF EXISTS "Comments select for project members" ON public.project_comments;
DROP POLICY IF EXISTS "Comments insert for project members" ON public.project_comments;
DROP POLICY IF EXISTS "Comments update author or admin" ON public.project_comments;
DROP POLICY IF EXISTS "Comments delete author or admin" ON public.project_comments;

CREATE POLICY "project_comments_select"
  ON public.project_comments FOR SELECT TO authenticated
  USING (public.project_accessible(project_id));

CREATE POLICY "project_comments_insert"
  ON public.project_comments FOR INSERT TO authenticated
  WITH CHECK (
    public.project_accessible(project_id)
    AND author_id = auth.uid()
  );

CREATE POLICY "project_comments_update"
  ON public.project_comments FOR UPDATE TO authenticated
  USING (
    public.project_accessible(project_id)
    AND (
      author_id = auth.uid()
      OR public.is_app_admin()
    )
  )
  WITH CHECK (
    public.project_accessible(project_id)
    AND (
      author_id = auth.uid()
      OR public.is_app_admin()
    )
  );

CREATE POLICY "project_comments_delete"
  ON public.project_comments FOR DELETE TO authenticated
  USING (
    public.project_accessible(project_id)
    AND (
      author_id = auth.uid()
      OR public.is_app_admin()
    )
  );

DROP POLICY IF EXISTS "Files select for project members" ON public.project_files;
DROP POLICY IF EXISTS "Files insert for project members" ON public.project_files;
DROP POLICY IF EXISTS "Files delete uploader or admin" ON public.project_files;

CREATE POLICY "project_files_select"
  ON public.project_files FOR SELECT TO authenticated
  USING (public.project_accessible(project_id));

CREATE POLICY "project_files_insert"
  ON public.project_files FOR INSERT TO authenticated
  WITH CHECK (
    public.project_accessible(project_id)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "project_files_delete"
  ON public.project_files FOR DELETE TO authenticated
  USING (
    public.project_accessible(project_id)
    AND (
      uploaded_by = auth.uid()
      OR public.is_app_admin()
    )
  );

DROP POLICY IF EXISTS "Tasks select for project members" ON public.project_tasks;
DROP POLICY IF EXISTS "Tasks insert for project members" ON public.project_tasks;
DROP POLICY IF EXISTS "Tasks update for project members" ON public.project_tasks;
DROP POLICY IF EXISTS "Tasks delete for project members" ON public.project_tasks;

CREATE POLICY "project_tasks_select"
  ON public.project_tasks FOR SELECT TO authenticated
  USING (public.project_accessible(project_id));

CREATE POLICY "project_tasks_insert"
  ON public.project_tasks FOR INSERT TO authenticated
  WITH CHECK (public.project_accessible(project_id));

CREATE POLICY "project_tasks_update"
  ON public.project_tasks FOR UPDATE TO authenticated
  USING (public.project_accessible(project_id))
  WITH CHECK (public.project_accessible(project_id));

CREATE POLICY "project_tasks_delete"
  ON public.project_tasks FOR DELETE TO authenticated
  USING (public.project_accessible(project_id));

DROP POLICY IF EXISTS "Updates select for project members" ON public.project_updates;
DROP POLICY IF EXISTS "Updates insert for project members" ON public.project_updates;

DROP FUNCTION IF EXISTS public.is_project_member(uuid);

CREATE POLICY "project_updates_select"
  ON public.project_updates FOR SELECT TO authenticated
  USING (public.project_accessible(project_id));

CREATE POLICY "project_updates_insert_check"
  ON public.project_updates FOR INSERT TO authenticated
  WITH CHECK (
    public.project_accessible(project_id)
    AND author_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Workspaces + Mitglieder + Einladungen RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select"
  ON public.workspaces FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(id)
  );

CREATE POLICY "workspaces_insert"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "workspaces_update"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(id)
  )
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(id)
  );

CREATE POLICY "workspaces_delete"
  ON public.workspaces FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(id)
  );

CREATE POLICY "workspace_members_select"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_in_workspace(workspace_id)
  );

CREATE POLICY "workspace_members_insert"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );

CREATE POLICY "workspace_members_delete"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "workspace_invites_select"
  ON public.workspace_invites FOR SELECT TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
    OR lower(trim(email)) = lower(trim((SELECT email FROM public.profiles WHERE id = auth.uid())))
  );

CREATE POLICY "workspace_invites_insert"
  ON public.workspace_invites FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );

CREATE POLICY "workspace_invites_delete"
  ON public.workspace_invites FOR DELETE TO authenticated
  USING (
    public.is_app_admin()
    OR public.user_is_workspace_admin(workspace_id)
  );

-- updated_at Trigger für workspaces
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspaces_updated_at ON public.workspaces;
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 012_project_rls_workspace_admin_updates.sql
-- =============================================================================

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

-- =============================================================================
-- 013_first_file_id_per_project.sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.first_file_id_per_project(p_ids uuid[])
RETURNS TABLE (project_id uuid, file_id uuid)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT ON (pf.project_id)
    pf.project_id,
    pf.id AS file_id
  FROM public.project_files pf
  WHERE pf.project_id = ANY (p_ids)
  ORDER BY pf.project_id, pf.created_at ASC NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.first_file_id_per_project(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.first_file_id_per_project(uuid[]) TO authenticated;

-- =============================================================================
-- 014_workspace_project_labels.sql
-- =============================================================================

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

-- 015_project_label_sections.sql
-- Zusätzliche editierbare Bereichs-Überschriften (Nr. 11–19)

INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  ('stammdatenHeading', 'Stammdaten', 'Master data', 11),
  ('photosHeading', 'Fotos zum Projekt', 'Photos for the project', 12),
  (
    'photosIntro',
    'Hier kannst du direkt vom Handy (Kamera/Galerie) oder vom Rechner Fotos hochladen.',
    'Upload photos from your phone (camera/gallery) or from your computer.',
    13
  ),
  ('commentsHeading', 'Kommentare', 'Comments', 14),
  ('tasksHeading', 'Aufgaben', 'Tasks', 15),
  ('checklistHeading', 'Checkliste', 'Checklist', 16),
  ('timelineHeading', 'Timeline', 'Timeline', 17),
  (
    'timelineSubtitle',
    'Wer hat wann etwas geschrieben, geändert oder hochgeladen',
    'Who wrote, changed or uploaded something and when',
    18
  ),
  ('historyHeading', 'Historie', 'History', 19)
ON CONFLICT (key) DO UPDATE SET
  label_de = EXCLUDED.label_de,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order;

UPDATE public.project_labels
SET
  label_de = 'Bilder, Zeichnungen, PDFs, Präsentationen',
  label_en = 'Images, drawings, PDFs, presentations'
WHERE key = 'files';

-- 016_header_title_label.sql
INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  (
    'headerTitle',
    'Projektname',
    'Project name',
    20
  )
ON CONFLICT (key) DO NOTHING;

-- 017_workspace_project_labels_app_admin_only.sql
DROP POLICY IF EXISTS "workspace_project_labels_insert" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_insert"
  ON public.workspace_project_labels FOR INSERT TO authenticated
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "workspace_project_labels_update" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_update"
  ON public.workspace_project_labels FOR UPDATE TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS "workspace_project_labels_delete" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_delete"
  ON public.workspace_project_labels FOR DELETE TO authenticated
  USING (public.is_app_admin());

-- 018_header_title_default_projektname.sql
UPDATE public.project_labels
SET
  label_de = 'Projektname',
  label_en = 'Project name'
WHERE key = 'headerTitle'
  AND (
    label_de = 'Produktentwicklung Polstermöbel'
    OR label_en = 'Product Development Upholstery'
  );

-- 019_project_categories_defaults.sql
INSERT INTO public.project_categories (name, prefix, sort_order) VALUES
  ('Sessel', 'PM_Chairs', 1),
  ('Polstergarnituren', 'PM_Sofa', 2),
  ('Aufstehsessel', 'PM_MC', 3),
  ('Bettgestelle', 'PM_Bed', 4)
ON CONFLICT (prefix) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- 020_project_label_categories_prefix_footnote.sql
INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  (
    'categoriesPrefixFootnote',
    '* (das, was vor einer laufenden Nummerierung stehen soll, die automatisch generiert wird).',
    '* (the text that should appear before the automatically generated serial number).',
    21
  )
ON CONFLICT (key) DO NOTHING;

-- 021_project_label_stammdaten_affixes.sql
INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  ('categoryLabelPrefix', '', '', 1),
  ('devNumberLabelPrefix', '*', '*', 2)
ON CONFLICT (key) DO UPDATE SET
  label_de = EXCLUDED.label_de,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order;

-- 022_project_categories_per_workspace.sql
ALTER TABLE public.project_categories
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces (id) ON DELETE CASCADE;

ALTER TABLE public.project_categories DROP CONSTRAINT IF EXISTS project_categories_prefix_key;

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

DROP POLICY IF EXISTS "project_categories_select" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_insert" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_update" ON public.project_categories;
DROP POLICY IF EXISTS "project_categories_delete" ON public.project_categories;

CREATE POLICY "project_categories_select"
  ON public.project_categories FOR SELECT TO authenticated
  USING (
    public.is_app_admin ()
    OR public.user_in_workspace (workspace_id)
  );

CREATE POLICY "project_categories_insert"
  ON public.project_categories FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  );

CREATE POLICY "project_categories_update"
  ON public.project_categories FOR UPDATE TO authenticated
  USING (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  )
  WITH CHECK (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  );

CREATE POLICY "project_categories_delete"
  ON public.project_categories FOR DELETE TO authenticated
  USING (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  );

-- 023_workspace_project_labels_workspace_admin_write.sql
DROP POLICY IF EXISTS "workspace_project_labels_insert" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_insert"
  ON public.workspace_project_labels FOR INSERT TO authenticated
  WITH CHECK (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_update" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_update"
  ON public.workspace_project_labels FOR UPDATE TO authenticated
  USING (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  )
  WITH CHECK (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  );

DROP POLICY IF EXISTS "workspace_project_labels_delete" ON public.workspace_project_labels;
CREATE POLICY "workspace_project_labels_delete"
  ON public.workspace_project_labels FOR DELETE TO authenticated
  USING (
    public.is_app_admin ()
    OR public.user_is_workspace_admin (workspace_id)
  );

-- 024_remove_stammdaten_affix_label_keys.sql
DELETE FROM public.workspace_project_labels
WHERE key IN (
  'categoryLabelPrefix',
  'devNumberLabelPrefix',
  'categoriesPrefixFootnote'
);

DELETE FROM public.project_labels
WHERE key IN (
  'categoryLabelPrefix',
  'devNumberLabelPrefix',
  'categoriesPrefixFootnote'
);

-- Ende ALL_MIGRATIONS_ONE_FILE.sql
