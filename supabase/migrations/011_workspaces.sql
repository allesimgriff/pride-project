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

DROP FUNCTION IF EXISTS public.is_project_member(uuid);

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
