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
  ('Auftsehsessel', 'PM_MC', 3),
  ('Bettgestelle', 'PM_Bed', 4);
