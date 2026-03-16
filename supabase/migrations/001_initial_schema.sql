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
