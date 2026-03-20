-- Projekte: Zugriff nur für Admin, Ersteller (created_by) oder Verantwortliche (responsible_id).
-- Vorher: Alte Zeilen ohne created_by werden sinnvoll befüllt.

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects pr
    WHERE pr.id = p_project_id
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles pf
          WHERE pf.id = auth.uid() AND pf.role = 'admin'
        )
        OR pr.created_by = auth.uid()
        OR pr.responsible_id = auth.uid()
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_project_member(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- Legacy: created_by setzen
UPDATE public.projects p
SET created_by = COALESCE(
  p.created_by,
  p.responsible_id,
  (SELECT id FROM public.profiles WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1),
  (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1)
)
WHERE p.created_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

-- projects
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;

CREATE POLICY "Project select for members"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_project_member(id));

CREATE POLICY "Project insert with owner"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Project update for members"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.is_project_member(id))
  WITH CHECK (public.is_project_member(id));

-- project_comments
DROP POLICY IF EXISTS "Comments viewable by authenticated" ON public.project_comments;
DROP POLICY IF EXISTS "Comments insertable by authenticated" ON public.project_comments;
DROP POLICY IF EXISTS "Comments updatable by author" ON public.project_comments;
DROP POLICY IF EXISTS "Comments deletable by author or admin" ON public.project_comments;

CREATE POLICY "Comments select for project members"
  ON public.project_comments FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Comments insert for project members"
  ON public.project_comments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND author_id = auth.uid()
  );

CREATE POLICY "Comments update author or admin"
  ON public.project_comments FOR UPDATE TO authenticated
  USING (
    public.is_project_member(project_id)
    AND (
      author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  )
  WITH CHECK (
    public.is_project_member(project_id)
    AND (
      author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Comments delete author or admin"
  ON public.project_comments FOR DELETE TO authenticated
  USING (
    public.is_project_member(project_id)
    AND (
      author_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- project_files
DROP POLICY IF EXISTS "Files viewable by authenticated" ON public.project_files;
DROP POLICY IF EXISTS "Files insertable by authenticated" ON public.project_files;
DROP POLICY IF EXISTS "Files deletable by uploader or admin" ON public.project_files;

CREATE POLICY "Files select for project members"
  ON public.project_files FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Files insert for project members"
  ON public.project_files FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Files delete uploader or admin"
  ON public.project_files FOR DELETE TO authenticated
  USING (
    public.is_project_member(project_id)
    AND (
      uploaded_by = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- project_tasks
DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.project_tasks;
DROP POLICY IF EXISTS "Tasks insertable by authenticated" ON public.project_tasks;
DROP POLICY IF EXISTS "Tasks updatable by authenticated" ON public.project_tasks;
DROP POLICY IF EXISTS "Tasks deletable by authenticated" ON public.project_tasks;

CREATE POLICY "Tasks select for project members"
  ON public.project_tasks FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Tasks insert for project members"
  ON public.project_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Tasks update for project members"
  ON public.project_tasks FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Tasks delete for project members"
  ON public.project_tasks FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- project_updates
DROP POLICY IF EXISTS "Updates viewable by authenticated" ON public.project_updates;
DROP POLICY IF EXISTS "Updates insertable by authenticated" ON public.project_updates;

CREATE POLICY "Updates select for project members"
  ON public.project_updates FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Updates insert for project members"
  ON public.project_updates FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND author_id = auth.uid()
  );
