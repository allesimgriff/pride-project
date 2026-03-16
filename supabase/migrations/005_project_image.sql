-- Projektbild: Ein Bild pro Projekt als Vorschaubild
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS project_image_id UUID REFERENCES public.project_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_project_image ON public.projects(project_image_id);
