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

