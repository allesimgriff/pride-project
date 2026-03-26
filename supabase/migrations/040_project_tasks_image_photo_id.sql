ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS image_photo_id uuid REFERENCES public.photos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_tasks_image_photo_id
  ON public.project_tasks(image_photo_id);
