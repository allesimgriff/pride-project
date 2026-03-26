ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS image_file_id uuid REFERENCES public.project_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_tasks_image_file_id
  ON public.project_tasks(image_file_id);
