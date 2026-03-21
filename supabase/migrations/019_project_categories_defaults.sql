-- Standard-Kategorien: anlegen oder Namen/Sortierung an offizielle Defaults anpassen (Präfix = Schlüssel)

INSERT INTO public.project_categories (name, prefix, sort_order) VALUES
  ('Sessel', 'PM_Chairs', 1),
  ('Polstergarnituren', 'PM_Sofa', 2),
  ('Aufstehsessel', 'PM_MC', 3),
  ('Bettgestelle', 'PM_Bed', 4)
ON CONFLICT (prefix) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;
