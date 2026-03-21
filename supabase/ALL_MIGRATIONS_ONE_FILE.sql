/*
 * =============================================================================
 * PRIDE – alle Datenbank-Migrationen in EINER Datei für Supabase
 * =============================================================================
 *
 * WO ausführen: supabase.com → dein Projekt → SQL → New query → alles einfügen → Run
 *
 * WANN sinnvoll:
 *   - Du hast sicher noch KEINE dieser Migrationen eingespielt.
 *
 * PFLICHT vor Abschnitt 011 (Workspaces):
 *   Mindestens EINE Zeile in public.profiles (sonst bricht das Skript ab).
 *   Bei leerer DB: Authentication → User anlegen, Table Editor → profiles → Zeile mit
 *   gleicher UUID + email + role. Siehe LOKAL_STARTEN.md → Teil B2-Einfach.
 *
 * WENN du schon eine ältere PRIDE-DB hast:
 *   - Dieses Skript kann mit Fehlern abbrechen („existiert bereits“).
 *   - Dann besser die einzelnen Dateien unter supabase/migrations/ nacheinander
 *     wie in LOKAL_STARTEN.md – fehlgeschlagene Schritte überspringen.
 *
 * Storage: Buckets für Datei-Uploads (z. B. „project-files“, „project-photos“) ggf.
 * zusätzlich im Dashboard unter Storage anlegen, falls die App das brauchst.
 *
 * Danach: Authentication → URL Configuration (localhost) – siehe LOKAL_STARTEN.md
 * =============================================================================
 */

-- =============================================================================
-- 001_initial_schema.sql
-- =============================================================================

-- Pride Product Development Platform - Initial Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'admin',
  'projektleitung',
  'entwicklung',
  'einkauf',
  'vertrieb',
  'externer_partner'
);

-- Project status enum
CREATE TYPE project_status AS ENUM (
  'idee',
  'konzept',
  'entwicklung',
  'muster',
  'freigabe',
  'abgeschlossen',
  'archiviert'
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM (
  'niedrig',
  'mittel',
  'hoch',
  'dringend'
);

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'entwicklung',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dev_number TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category TEXT,
  customer_market_country TEXT,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status project_status NOT NULL DEFAULT 'idee',
  description TEXT,
  technical_data JSONB DEFAULT '{}',
  functions TEXT,
  materials TEXT,
  target_price DECIMAL(12, 2),
  open_points TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project comments
CREATE TABLE public.project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project files (metadata; actual files in Storage)
CREATE TABLE public.project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project tasks
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority task_priority NOT NULL DEFAULT 'mittel',
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project updates (change history)
CREATE TABLE public.project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  change_summary TEXT NOT NULL,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_responsible ON public.projects(responsible_id);
CREATE INDEX idx_projects_category ON public.projects(category);
CREATE INDEX idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX idx_project_comments_project ON public.project_comments(project_id);
CREATE INDEX idx_project_files_project ON public.project_files(project_id);
CREATE INDEX idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_responsible ON public.project_tasks(responsible_id);
CREATE INDEX idx_project_tasks_completed ON public.project_tasks(completed);
CREATE INDEX idx_project_updates_project ON public.project_updates(project_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Profile is created on signup"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Projects: authenticated users can CRUD (adjust for stricter role-based if needed)
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON public.projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON public.projects FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Comments
CREATE POLICY "Comments viewable by authenticated"
  ON public.project_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Comments insertable by authenticated"
  ON public.project_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Comments updatable by author"
  ON public.project_comments FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Comments deletable by author or admin"
  ON public.project_comments FOR DELETE TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Files
CREATE POLICY "Files viewable by authenticated"
  ON public.project_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Files insertable by authenticated"
  ON public.project_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Files deletable by uploader or admin"
  ON public.project_files FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Tasks
CREATE POLICY "Tasks viewable by authenticated"
  ON public.project_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Tasks insertable by authenticated"
  ON public.project_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Tasks updatable by authenticated"
  ON public.project_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Tasks deletable by authenticated"
  ON public.project_tasks FOR DELETE TO authenticated USING (true);

-- Updates
CREATE POLICY "Updates viewable by authenticated"
  ON public.project_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Updates insertable by authenticated"
  ON public.project_updates FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'entwicklung')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: update projects.updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER project_comments_updated_at
  BEFORE UPDATE ON public.project_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for project files (run in Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);
-- Storage policies: allow authenticated read/write for project-files

-- =============================================================================
-- 002_fix_handle_new_user.sql
-- =============================================================================

-- Fix: Trigger darf User-Erstellung nie blockieren. Bei Fehler (z.B. RLS) wird Profil beim ersten Login in der App angelegt.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_val user_role := 'entwicklung';
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'role' IN (
    'admin', 'projektleitung', 'entwicklung', 'einkauf', 'vertrieb', 'externer_partner'
  ) THEN
    user_role_val := (NEW.raw_user_meta_data->>'role')::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email),
    user_role_val
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 003_drop_trigger_create_user.sql
-- =============================================================================

-- Trigger entfernen – User-Erstellung im Supabase-Dashboard funktioniert dann wieder.
-- Das Profil wird beim ersten Login in der App angelegt.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================================
-- 004_project_categories.sql
-- =============================================================================

-- Kategorien für Projekte (nur Admin darf bearbeiten)
CREATE TABLE public.project_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  prefix TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_categories_sort ON public.project_categories(sort_order);

ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;

-- Alle dürfen Kategorien lesen
CREATE POLICY "Categories are viewable by authenticated users"
  ON public.project_categories FOR SELECT TO authenticated USING (true);

-- Nur Admin darf anlegen/bearbeiten/löschen
CREATE POLICY "Only admins can insert categories"
  ON public.project_categories FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update categories"
  ON public.project_categories FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can delete categories"
  ON public.project_categories FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Startdaten
INSERT INTO public.project_categories (name, prefix, sort_order) VALUES
  ('Sessel', 'PM_Chairs', 1),
  ('Polstergarnituren', 'PM_Sofa', 2),
  ('Aufstehsessel', 'PM_MC', 3),
  ('Bettgestelle', 'PM_Bed', 4);

-- =============================================================================
-- 005_invites.sql
-- =============================================================================

-- Mitarbeiter-Einladungen / Invites
-- Dieses Skript in Supabase im SQL-Editor ausführen.

CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'projektleitung',
  token UUID NOT NULL UNIQUE,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Nutzer dürfen Einladungen sehen
CREATE POLICY "Invites are viewable by authenticated users"
  ON public.invites FOR SELECT TO authenticated
  USING (true);

-- Nur Admin darf Einladungen anlegen
CREATE POLICY "Only admin can insert invites"
  ON public.invites FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Nur Admin darf Einladungen als angenommen markieren (optional, kann auch serverseitig ohne Policy laufen)
CREATE POLICY "Only admin can update invites"
  ON public.invites FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- =============================================================================
-- 005_project_image.sql
-- =============================================================================

-- Projektbild: Ein Bild pro Projekt als Vorschaubild
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_image_id UUID REFERENCES public.project_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_project_image ON public.projects(project_image_id);

-- =============================================================================
-- 006_avatars_bucket.sql
-- =============================================================================

-- Avatar-Bucket für Profilbilder (öffentlich lesbar)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Jeder Nutzer darf nur eigene Dateien unter avatars/{user_id}/ hochladen/aktualisieren/löschen
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Bei public = true sind Dateien automatisch lesbar; keine eigene SELECT-Policy nötig.

-- =============================================================================
-- 007_admin_update_profiles.sql
-- =============================================================================

-- Admin darf Rollen (und andere Felder) bei anderen Profiles ändern

CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- =============================================================================
-- 008_invites_delete_policy.sql
-- =============================================================================

-- Admin darf Einladungen löschen (Widerrufen)

CREATE POLICY "Only admin can delete invites"
  ON public.invites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- =============================================================================
-- 009_project_labels.sql
-- =============================================================================

-- Frei editierbare Projekt-Überschriften

CREATE TABLE IF NOT EXISTS public.project_labels (
  key TEXT PRIMARY KEY,
  label_de TEXT NOT NULL,
  label_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project labels are viewable by authenticated users" ON public.project_labels;
CREATE POLICY "Project labels are viewable by authenticated users"
  ON public.project_labels FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can insert project labels" ON public.project_labels;
CREATE POLICY "Only admins can insert project labels"
  ON public.project_labels FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Only admins can update project labels" ON public.project_labels;
CREATE POLICY "Only admins can update project labels"
  ON public.project_labels FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.project_labels (key, label_de, label_en, sort_order)
VALUES
  ('category', 'Kategorie', 'Category', 1),
  ('devNumber', 'Entwicklungsnummer', 'Dev number', 2),
  ('productName', 'Produktname', 'Product name', 3),
  ('status', 'Status', 'Status', 4),
  ('description', 'Beschreibung', 'Description', 5),
  ('files', 'Dateien', 'Files', 6),
  ('technicalNotes', 'Technische Merkmale', 'Technical details', 7),
  ('functions', 'Funktionen', 'Functions', 8),
  ('materials', 'Materialien', 'Materials', 9),
  ('openPoints', 'Offene Punkte', 'Open points', 10)
ON CONFLICT (key) DO NOTHING;


-- =============================================================================
-- 010_project_owner_rls.sql
-- =============================================================================

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
